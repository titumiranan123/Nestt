import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { createClient, type RedisClientType } from 'redis';
import { AppConfigService } from '../../config/app.config.js';
import type { ChallengePurpose } from './challenge-purpose.js';

const ISSUE_TTL_SECONDS = 10 * 60;

const HIT_LIMIT_SCRIPT = `
  local count = redis.call('INCR', KEYS[1])
  if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
  return count
`;

const CONSUME_CHALLENGE_SCRIPT = `
  local value = redis.call('GET', KEYS[1])
  if not value then return nil end
  local challenge = cjson.decode(value)
  if tonumber(challenge.attempts) >= 5 then return nil end
  if challenge.codeHash ~= ARGV[1] then
    challenge.attempts = tonumber(challenge.attempts) + 1
    local ttl = redis.call('PTTL', KEYS[1])
    redis.call('SET', KEYS[1], cjson.encode(challenge))
    if ttl > 0 then redis.call('PEXPIRE', KEYS[1], ttl) end
    return nil
  end
  redis.call('DEL', KEYS[1])
  return value
`;

const DELETE_CHALLENGE_SCRIPT = `
  local value = redis.call('GET', KEYS[1])
  if not value then return 0 end
  local challenge = cjson.decode(value)
  if challenge.id ~= ARGV[1] then return 0 end
  return redis.call('DEL', KEYS[1])
`;

const CREATE_SESSION_SCRIPT = `
  redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[6])
  redis.call('SET', KEYS[2], ARGV[2], 'EX', ARGV[7])
  redis.call('SADD', KEYS[3], ARGV[3])
  redis.call('EXPIRE', KEYS[3], ARGV[6])
  redis.call('SADD', KEYS[4], ARGV[4])
  redis.call('EXPIRE', KEYS[4], ARGV[6])
  redis.call('SET', KEYS[5], ARGV[5], 'EX', ARGV[6])
  return 1
`;

const ROTATE_SESSION_SCRIPT = `
  local oldValue = redis.call('GET', KEYS[1])
  if not oldValue then return 0 end
  local old = cjson.decode(oldValue)
  if old.userId ~= ARGV[1] or old.tokenHash ~= ARGV[2] then return 0 end
  if old.rotated then
    local familyKey = ARGV[11] .. old.familyId
    local members = redis.call('SMEMBERS', familyKey)
    for _, refreshId in ipairs(members) do
      local refreshKey = ARGV[8] .. refreshId
      local refreshValue = redis.call('GET', refreshKey)
      if refreshValue then
        local refresh = cjson.decode(refreshValue)
        redis.call('DEL', ARGV[9] .. refresh.accessId)
      end
      redis.call('DEL', refreshKey)
    end
    redis.call('DEL', familyKey)
    redis.call('SREM', KEYS[2], old.familyId)
    return -1
  end

  local oldTtl = redis.call('TTL', KEYS[1])
  old.rotated = true
  redis.call('SET', KEYS[1], cjson.encode(old), 'EX', oldTtl)
  redis.call('DEL', ARGV[9] .. old.accessId)
  local nextSession = cjson.decode(ARGV[3])
  nextSession.familyId = old.familyId
  redis.call('SET', KEYS[3], cjson.encode(nextSession), 'EX', ARGV[6])
  redis.call('SET', KEYS[4], ARGV[4], 'EX', ARGV[7])
  local familyKey = ARGV[11] .. old.familyId
  redis.call('SADD', familyKey, ARGV[5])
  redis.call('EXPIRE', familyKey, ARGV[6])
  redis.call('EXPIRE', KEYS[2], ARGV[6])
  redis.call('SET', KEYS[5], ARGV[10], 'EX', ARGV[6])
  return 1
`;

const REVOKE_FAMILY_SCRIPT = `
  local value = redis.call('GET', KEYS[1])
  if not value then return 0 end
  local session = cjson.decode(value)
  if session.userId ~= ARGV[1] then return 0 end
  local members = redis.call('SMEMBERS', KEYS[2])
  for _, refreshId in ipairs(members) do
    local refreshKey = ARGV[2] .. refreshId
    local refreshValue = redis.call('GET', refreshKey)
    if refreshValue then
      local refresh = cjson.decode(refreshValue)
      redis.call('DEL', ARGV[3] .. refresh.accessId)
    end
    redis.call('DEL', refreshKey)
  end
  redis.call('DEL', KEYS[2])
  redis.call('SREM', KEYS[3], session.familyId)
  return 1
`;

const VALIDATE_ACCESS_SCRIPT = `
  local value = redis.call('GET', KEYS[1])
  if not value then return 0 end
  local session = cjson.decode(value)
  if session.userId ~= ARGV[1] or tonumber(session.authVersion) ~= tonumber(ARGV[2]) then return 0 end
  return 1
`;

const REVOKE_USER_SESSIONS_SCRIPT = `
  local families = redis.call('SMEMBERS', KEYS[1])
  for _, familyId in ipairs(families) do
    local familyKey = ARGV[1] .. familyId
    local members = redis.call('SMEMBERS', familyKey)
    for _, refreshId in ipairs(members) do
      local refreshKey = ARGV[2] .. refreshId
      local value = redis.call('GET', refreshKey)
      if value then
        local session = cjson.decode(value)
        redis.call('DEL', ARGV[3] .. session.accessId)
      end
      redis.call('DEL', refreshKey)
    end
    redis.call('DEL', familyKey)
  end
  redis.call('DEL', KEYS[1])
  return #families
`;

export type RedisChallenge = {
  id: string;
  target: string;
  codeHash: string;
  userId: string | null;
  attempts: number;
  createdAt: string;
};

export type RedisSession = {
  id: string;
  familyId: string;
  userId: string;
  authVersion: number;
  tokenHash: string;
  accessId: string;
  rotated: boolean;
  createdAt: string;
};

@Injectable()
export class RedisAuthStore implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisAuthStore.name);
  private readonly client: RedisClientType;

  constructor(config: AppConfigService) {
    this.client = createClient({ url: config.values.REDIS_URL });
    this.client.on('error', (error) =>
      this.logger.error('Redis connection error', error),
    );
  }

  async onModuleInit(): Promise<void> {
    await this.client.connect();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.isOpen) await this.client.quit();
  }

  async hitLimit(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<boolean> {
    const count = Number(
      await this.client.eval(HIT_LIMIT_SCRIPT, {
        keys: [`nestt:auth:limit:${key}`],
        arguments: [String(windowSeconds)],
      }),
    );
    return count <= limit;
  }

  async issueChallenge(
    purpose: ChallengePurpose,
    target: string,
    codeHash: string,
    userId?: string,
  ): Promise<RedisChallenge> {
    const challenge: RedisChallenge = {
      id: randomUUID(),
      target,
      codeHash,
      userId: userId ?? null,
      attempts: 0,
      createdAt: new Date().toISOString(),
    };
    await this.client.set(
      this.challengeKey(purpose, target, userId),
      JSON.stringify(challenge),
      { EX: ISSUE_TTL_SECONDS },
    );
    return challenge;
  }

  async consumeChallenge(
    purpose: ChallengePurpose,
    target: string,
    codeHash: string,
    userId?: string,
  ): Promise<RedisChallenge | null> {
    const result = await this.client.eval(CONSUME_CHALLENGE_SCRIPT, {
      keys: [this.challengeKey(purpose, target, userId)],
      arguments: [codeHash],
    });
    if (typeof result !== 'string') return null;
    return JSON.parse(result) as RedisChallenge;
  }

  async deleteChallenge(
    purpose: ChallengePurpose,
    target: string,
    userId: string | undefined,
    id: string,
  ): Promise<void> {
    await this.client.eval(DELETE_CHALLENGE_SCRIPT, {
      keys: [this.challengeKey(purpose, target, userId)],
      arguments: [id],
    });
  }

  async createSession(
    refreshId: string,
    familyId: string,
    userId: string,
    authVersion: number,
    tokenHash: string,
    accessId: string,
    accessTtlSeconds: number,
    refreshTtlSeconds: number,
  ): Promise<void> {
    const session: RedisSession = {
      id: refreshId,
      familyId,
      userId,
      authVersion,
      tokenHash,
      accessId,
      rotated: false,
      createdAt: new Date().toISOString(),
    };
    const access = { userId, authVersion, refreshId };
    await this.client.eval(CREATE_SESSION_SCRIPT, {
      keys: [
        this.refreshKey(userId, refreshId),
        this.accessKey(userId, accessId),
        this.familyKey(userId, familyId),
        this.userFamiliesKey(userId),
        this.lastLoginKey(userId),
      ],
      arguments: [
        JSON.stringify(session),
        JSON.stringify(access),
        refreshId,
        familyId,
        new Date().toISOString(),
        String(refreshTtlSeconds),
        String(accessTtlSeconds),
      ],
    });
  }

  async rotateSession(
    oldId: string,
    userId: string,
    tokenHash: string,
    nextId: string,
    nextHash: string,
    nextAccessId: string,
    authVersion: number,
    accessTtlSeconds: number,
    refreshTtlSeconds: number,
  ): Promise<boolean> {
    const nextSession = {
      id: nextId,
      userId,
      authVersion,
      tokenHash: nextHash,
      accessId: nextAccessId,
      rotated: false,
      createdAt: new Date().toISOString(),
    };
    const nextAccess = { userId, authVersion, refreshId: nextId };
    const result = Number(
      await this.client.eval(ROTATE_SESSION_SCRIPT, {
        keys: [
          this.refreshKey(userId, oldId),
          this.userFamiliesKey(userId),
          this.refreshKey(userId, nextId),
          this.accessKey(userId, nextAccessId),
          this.lastLoginKey(userId),
        ],
        arguments: [
          userId,
          tokenHash,
          JSON.stringify(nextSession),
          JSON.stringify(nextAccess),
          nextId,
          String(refreshTtlSeconds),
          String(accessTtlSeconds),
          `nestt:auth:refresh:{${userId}}:`,
          `nestt:auth:access:{${userId}}:`,
          new Date().toISOString(),
          `nestt:auth:family:{${userId}}:`,
        ],
      }),
    );
    return result === 1;
  }

  async revokeSession(refreshId: string, userId: string): Promise<void> {
    const session = await this.getSession(userId, refreshId);
    if (!session) return;
    await this.client.eval(REVOKE_FAMILY_SCRIPT, {
      keys: [
        this.refreshKey(userId, refreshId),
        this.familyKey(userId, session.familyId),
        this.userFamiliesKey(userId),
      ],
      arguments: [
        userId,
        `nestt:auth:refresh:{${userId}}:`,
        `nestt:auth:access:{${userId}}:`,
      ],
    });
  }

  async revokeUserSessions(userId: string): Promise<void> {
    await this.client.eval(REVOKE_USER_SESSIONS_SCRIPT, {
      keys: [this.userFamiliesKey(userId), this.lastLoginKey(userId)],
      arguments: [
        `nestt:auth:family:{${userId}}:`,
        `nestt:auth:refresh:{${userId}}:`,
        `nestt:auth:access:{${userId}}:`,
      ],
    });
  }

  async isAccessActive(
    accessId: string,
    userId: string,
    authVersion: number,
  ): Promise<boolean> {
    const result = await this.client.eval(VALIDATE_ACCESS_SCRIPT, {
      keys: [this.accessKey(userId, accessId)],
      arguments: [userId, String(authVersion)],
    });
    return Number(result) === 1;
  }

  async lastLoginAt(userId: string): Promise<Date | null> {
    const timestamp = await this.client.get(this.lastLoginKey(userId));
    if (!timestamp) return null;
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private async getSession(
    userId: string,
    refreshId: string,
  ): Promise<RedisSession | null> {
    const value = await this.client.get(this.refreshKey(userId, refreshId));
    return value ? (JSON.parse(value) as RedisSession) : null;
  }

  private refreshKey(userId: string, id: string): string {
    return `nestt:auth:refresh:{${userId}}:${id}`;
  }

  private accessKey(userId: string, id: string): string {
    return `nestt:auth:access:{${userId}}:${id}`;
  }

  private familyKey(userId: string, familyId: string): string {
    return `nestt:auth:family:{${userId}}:${familyId}`;
  }

  private userFamiliesKey(userId: string): string {
    return `nestt:auth:user:{${userId}}:families`;
  }

  private lastLoginKey(userId: string): string {
    return `nestt:auth:user:{${userId}}:last-login`;
  }

  private challengeKey(
    purpose: ChallengePurpose,
    target: string,
    userId?: string,
  ): string {
    const identity = createHash('sha256')
      .update(JSON.stringify([purpose, target, userId ?? null]))
      .digest('hex');
    return `nestt:auth:challenge:${identity}`;
  }
}
