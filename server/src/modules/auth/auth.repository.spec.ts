import { ChallengePurpose, Prisma } from '@prisma/client';
import { ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AuthRepository } from './auth.repository.js';
import type { PrismaService } from '../../database/prisma.service.js';

describe('AuthRepository one-time challenges', () => {
  it('counts bad attempts, consumes a valid code once, and rejects replay', async () => {
    const challenge = {
      id: 'challenge-id',
      userId: 'user-id',
      purpose: ChallengePurpose.VERIFY_EMAIL,
      target: 'a@example.com',
      codeHash: 'a'.repeat(64),
      attempts: 0,
      consumedAt: null as Date | null,
      expiresAt: new Date(Date.now() + 60_000),
    };
    const tx = {
      authChallenge: {
        findFirst: vi.fn(async () =>
          challenge.consumedAt || challenge.expiresAt <= new Date()
            ? null
            : challenge,
        ),
        updateMany: vi.fn(
          async ({
            data,
          }: {
            data: { attempts?: { increment: number }; consumedAt?: Date };
          }) => {
            if (challenge.consumedAt) return { count: 0 };
            if (data.attempts) challenge.attempts += data.attempts.increment;
            if (data.consumedAt) challenge.consumedAt = data.consumedAt;
            return { count: 1 };
          },
        ),
      },
      user: {
        findUnique: vi.fn(async () => ({
          id: 'user-id',
          emailVerifiedAt: null,
          passwordHash: 'password-hash',
        })),
        update: vi.fn(async () => ({
          id: 'user-id',
          emailVerifiedAt: new Date(),
        })),
      },
    };
    const db = {
      $transaction: (callback: (client: unknown) => unknown) => callback(tx),
    } as unknown as PrismaService;
    const repo = new AuthRepository(db);
    expect(
      await repo.verifyEmail('a@example.com', 'b'.repeat(64), 'password-hash'),
    ).toBeNull();
    expect(challenge.attempts).toBe(1);
    expect(
      await repo.verifyEmail('a@example.com', 'a'.repeat(64), 'password-hash'),
    ).toMatchObject({ id: 'user-id' });
    expect(
      await repo.verifyEmail('a@example.com', 'a'.repeat(64), 'password-hash'),
    ).toBeNull();
    expect(tx.user.update).toHaveBeenCalledTimes(1);
  });

  it('revokes a refresh family when a rotated token is reused', async () => {
    const updateMany = vi.fn(async () => ({ count: 1 }));
    const tx = {
      refreshSession: {
        findUnique: vi.fn(async () => ({
          id: 'old',
          familyId: 'family',
          rotatedAt: new Date(),
          revokedAt: new Date(),
        })),
        updateMany,
      },
    };
    const db = {
      $transaction: (callback: (client: unknown) => unknown) => callback(tx),
    } as unknown as PrismaService;
    const repo = new AuthRepository(db);
    expect(
      await repo.rotateSession('old', 'hash', 'new', 'newhash', new Date()),
    ).toBeNull();
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { familyId: 'family', revokedAt: null },
      }),
    );
  });
});

function prismaUniqueError() {
  return new Prisma.PrismaClientKnownRequestError('unique conflict', {
    code: 'P2002',
    clientVersion: 'test',
  });
}

describe('AuthRepository persistence operations', () => {
  it('delegates user, session and rate limit operations', async () => {
    const rows = [{ count: 2 }];
    const db = {
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: 'user-1' }),
        create: vi.fn().mockResolvedValue({ id: 'user-1' }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      refreshSession: {
        create: vi.fn().mockResolvedValue({ id: 'session-1' }),
        findUnique: vi.fn().mockResolvedValue({ id: 'session-1' }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      $queryRaw: vi.fn().mockResolvedValue(rows),
    } as unknown as PrismaService;
    const repository = new AuthRepository(db);

    await repository.userByEmail('a@example.com');
    await repository.userByPhone('+15551234567');
    await repository.userById('user-1');
    await repository.createEmailUser('a@example.com', 'hash');
    await repository.updatePendingPassword('user-1', 'new-hash');
    await expect(repository.hitLimit('key', 5, 60)).resolves.toBe(true);
    await expect(repository.createSession('session-1', 'family', 'user-1', 'hash', new Date())).resolves.toMatchObject({ id: 'session-1' });
    await repository.sessionById('session-1');
    await repository.revokeSession('session-1', 'user-1');

    expect(db.user.findUnique).toHaveBeenCalledTimes(3);
    expect(db.user.create).toHaveBeenCalledWith({ data: { name: 'a', email: 'a@example.com', passwordHash: 'hash' } });
    expect(db.user.updateMany).toHaveBeenCalledWith({ where: { id: 'user-1', emailVerifiedAt: null }, data: { passwordHash: 'new-hash' } });
    expect(db.$queryRaw).toHaveBeenCalledOnce();
    expect(db.refreshSession.findUnique).toHaveBeenCalledWith({ where: { id: 'session-1' } });
    expect(db.refreshSession.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'session-1', userId: 'user-1', revokedAt: null } }));
  });

  it('replaces outstanding challenges inside a transaction and can delete a pending challenge', async () => {
    const tx = {
      authChallenge: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        create: vi.fn().mockResolvedValue({ id: 'challenge-2' }),
      },
    };
    const db = {
      $transaction: (callback: (client: unknown) => unknown) => callback(tx),
      authChallenge: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
    } as unknown as PrismaService;
    const repository = new AuthRepository(db);

    await expect(repository.issueChallenge(ChallengePurpose.RESET_PASSWORD, 'a@example.com', 'hash')).resolves.toMatchObject({ id: 'challenge-2' });
    expect(tx.authChallenge.updateMany).toHaveBeenCalledWith({
      where: { purpose: ChallengePurpose.RESET_PASSWORD, target: 'a@example.com', userId: null, consumedAt: null },
      data: { consumedAt: expect.any(Date) },
    });
    expect(tx.authChallenge.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ purpose: ChallengePurpose.RESET_PASSWORD, target: 'a@example.com', codeHash: 'hash', expiresAt: expect.any(Date) }),
    });
    await repository.deleteChallenge('challenge-2');
    expect(db.authChallenge.deleteMany).toHaveBeenCalledWith({ where: { id: 'challenge-2', consumedAt: null } });
  });

  it('rejects email verification for a missing, verified, or changed-password account', async () => {
    const challengeLookup = vi.fn();
    const userLookup = vi.fn();
    const tx = {
      user: { findUnique: userLookup, update: vi.fn() },
      authChallenge: { findFirst: challengeLookup, updateMany: vi.fn() },
    };
    const repo = new AuthRepository({ $transaction: (callback: (client: unknown) => unknown) => callback(tx) } as unknown as PrismaService);
    userLookup.mockResolvedValueOnce(null);
    await expect(repo.verifyEmail('a@example.com', 'hash', 'password')).resolves.toBeNull();
    userLookup.mockResolvedValueOnce({ id: 'u', emailVerifiedAt: new Date(), passwordHash: 'password' });
    await expect(repo.verifyEmail('a@example.com', 'hash', 'password')).resolves.toBeNull();
    userLookup.mockResolvedValueOnce({ id: 'u', emailVerifiedAt: null, passwordHash: 'other' });
    await expect(repo.verifyEmail('a@example.com', 'hash', 'password')).resolves.toBeNull();
    expect(challengeLookup).not.toHaveBeenCalled();
  });

  it('rejects challenges at the attempt limit and compares hashes of unequal lengths safely', async () => {
    const challenge = {
      id: 'challenge', userId: 'user', attempts: 5, codeHash: 'aa',
      expiresAt: new Date(Date.now() + 60_000),
    };
    const tx = {
      authChallenge: {
        findFirst: vi.fn().mockResolvedValue(challenge),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const repo = new AuthRepository({ $transaction: (cb: (client: unknown) => unknown) => cb(tx) } as unknown as PrismaService);
    await expect(repo.completePhoneLogin('+15551234567', 'aabb')).resolves.toBeNull();
    challenge.attempts = 0;
    await expect(repo.completePhoneLogin('+15551234567', 'aabb')).resolves.toBeNull();
    expect(tx.authChallenge.updateMany).toHaveBeenCalledTimes(1);
    expect(tx.authChallenge.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { attempts: { increment: 1 } } }));
  });

  it('verifies email only when the consumed challenge belongs to its pending account', async () => {
    const challenge = { id: 'challenge', userId: 'another-user', attempts: 0, codeHash: 'ab'.repeat(32), expiresAt: new Date(Date.now() + 60_000) };
    const tx = {
      user: { findUnique: vi.fn().mockResolvedValue({ id: 'user-1', emailVerifiedAt: null, passwordHash: 'password' }), update: vi.fn() },
      authChallenge: {
        findFirst: vi.fn().mockResolvedValue(challenge),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const repo = new AuthRepository({ $transaction: (cb: (client: unknown) => unknown) => cb(tx) } as unknown as PrismaService);
    await expect(repo.verifyEmail('a@example.com', 'ab'.repeat(32), 'password')).resolves.toBeNull();
    challenge.userId = 'user-1';
    tx.user.update.mockResolvedValueOnce({ id: 'user-1' });
    await expect(repo.verifyEmail('a@example.com', 'ab'.repeat(32), 'password')).resolves.toMatchObject({ id: 'user-1' });
  });

  it('completes phone login for existing users and creates new users from a valid challenge', async () => {
    const challenge = { id: 'challenge', attempts: 0, codeHash: 'cd'.repeat(32), expiresAt: new Date(Date.now() + 60_000) };
    const tx = {
      authChallenge: { findFirst: vi.fn().mockResolvedValue(challenge), updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      user: { findUnique: vi.fn().mockResolvedValue({ id: 'existing' }), create: vi.fn().mockResolvedValue({ id: 'created' }) },
    };
    const repo = new AuthRepository({ $transaction: (cb: (client: unknown) => unknown) => cb(tx) } as unknown as PrismaService);
    await expect(repo.completePhoneLogin('+15551234567', 'cd'.repeat(32))).resolves.toMatchObject({ id: 'existing' });
    tx.user.findUnique.mockResolvedValueOnce(null);
    await expect(repo.completePhoneLogin('+15551234567', 'cd'.repeat(32))).resolves.toMatchObject({ id: 'created' });
    expect(tx.user.create).toHaveBeenCalledWith({ data: { name: 'Customer', phone: '+15551234567', phoneVerifiedAt: expect.any(Date), isPhoneVerified: true } });
  });

  it('retries phone creation after a unique race and rethrows a repeated race', async () => {
    const makeTx = (create: ReturnType<typeof vi.fn>) => ({
      authChallenge: { findFirst: vi.fn().mockResolvedValue({ id: 'c', attempts: 0, codeHash: 'ef'.repeat(32), expiresAt: new Date(Date.now() + 60_000) }), updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      user: { findUnique: vi.fn().mockResolvedValue(null), create },
    });
    const first = makeTx(vi.fn().mockRejectedValue(prismaUniqueError()));
    const second = makeTx(vi.fn().mockResolvedValue({ id: 'winner' }));
    const transaction = vi.fn().mockImplementationOnce((cb) => cb(first)).mockImplementationOnce((cb) => cb(second));
    const repository = new AuthRepository({ $transaction: transaction } as unknown as PrismaService);
    await expect(repository.completePhoneLogin('+15551234567', 'ef'.repeat(32))).resolves.toMatchObject({ id: 'winner' });

    const repeated = makeTx(vi.fn().mockRejectedValue(prismaUniqueError()));
    const retry = vi.fn().mockImplementation((cb) => cb(repeated));
    const retryRepository = new AuthRepository({ $transaction: retry } as unknown as PrismaService);
    await expect(retryRepository.completePhoneLogin('+15551234567', 'ef'.repeat(32))).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
  });

  it('links email and phone and translates uniqueness conflicts', async () => {
    const challenge = { id: 'challenge', userId: 'user-1', attempts: 0, codeHash: '12'.repeat(32), expiresAt: new Date(Date.now() + 60_000) };
    const tx = {
      authChallenge: { findFirst: vi.fn().mockResolvedValue(challenge), updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: 'user-1', email: null, phone: null }),
        update: vi.fn().mockResolvedValue({ id: 'user-1' }),
      },
    };
    const repo = new AuthRepository({ $transaction: (cb: (client: unknown) => unknown) => cb(tx) } as unknown as PrismaService);
    await expect(repo.linkEmail('user-1', 'a@example.com', '12'.repeat(32), 'password-hash')).resolves.toMatchObject({ id: 'user-1' });
    await expect(repo.linkPhone('user-1', '+15551234567', '12'.repeat(32))).resolves.toMatchObject({ id: 'user-1' });
    expect(tx.user.update).toHaveBeenLastCalledWith({ where: { id: 'user-1' }, data: { phone: '+15551234567', phoneVerifiedAt: expect.any(Date), isPhoneVerified: true } });

    tx.user.findUnique.mockResolvedValueOnce({ id: 'user-1', email: 'other@example.com' });
    await expect(repo.linkEmail('user-1', 'a@example.com', '12'.repeat(32), 'password-hash')).rejects.toBeInstanceOf(ConflictException);
    const conflictTx = { ...tx, user: { ...tx.user, update: vi.fn().mockRejectedValue(prismaUniqueError()) } };
    const conflictRepo = new AuthRepository({ $transaction: (cb: (client: unknown) => unknown) => cb(conflictTx) } as unknown as PrismaService);
    await expect(conflictRepo.linkPhone('user-1', '+15551234567', '12'.repeat(32))).rejects.toThrow('Phone already in use');
  });

  it('rejects conflicting linked values and maps unique email conflicts', async () => {
    const challenge = { id: 'c', userId: 'user-1', attempts: 0, codeHash: '56'.repeat(32), expiresAt: new Date(Date.now() + 60_000) };
    const makeTx = (user: Record<string, unknown>, update = vi.fn().mockResolvedValue({ id: 'user-1' })) => ({
      authChallenge: { findFirst: vi.fn().mockResolvedValue(challenge), updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      user: { findUnique: vi.fn().mockResolvedValue(user), update },
    });
    const emailConflict = new AuthRepository({
      $transaction: (cb: (client: unknown) => unknown) => cb(makeTx({ id: 'user-1', email: null }, vi.fn().mockRejectedValue(prismaUniqueError()))),
    } as unknown as PrismaService);
    await expect(emailConflict.linkEmail('user-1', 'a@example.com', '56'.repeat(32), 'hash')).rejects.toThrow('Email already in use');

    const phoneConflict = new AuthRepository({
      $transaction: (cb: (client: unknown) => unknown) => cb(makeTx({ id: 'user-1', phone: '+15550000000' })),
    } as unknown as PrismaService);
    await expect(phoneConflict.linkPhone('user-1', '+15551234567', '56'.repeat(32))).rejects.toThrow('Phone already linked');

    const unexpected = new Error('database unavailable');
    const phoneFailure = new AuthRepository({
      $transaction: (cb: (client: unknown) => unknown) => cb(makeTx({ id: 'user-1', phone: null }, vi.fn().mockRejectedValue(unexpected))),
    } as unknown as PrismaService);
    await expect(phoneFailure.linkPhone('user-1', '+15551234567', '56'.repeat(32))).rejects.toBe(unexpected);
  });

  it('returns null when email or phone link challenges are absent', async () => {
    const tx = {
      authChallenge: { findFirst: vi.fn().mockResolvedValue(null), updateMany: vi.fn() },
      user: { findUnique: vi.fn(), update: vi.fn() },
    };
    const repository = new AuthRepository({
      $transaction: (callback: (client: unknown) => unknown) => callback(tx),
    } as unknown as PrismaService);

    await expect(repository.linkEmail('user-1', 'a@example.com', 'hash', 'password')).resolves.toBeNull();
    await expect(repository.linkPhone('user-1', '+15551234567', 'hash')).resolves.toBeNull();
    expect(tx.user.findUnique).not.toHaveBeenCalled();
  });

  it('resets the password, increments token version, and revokes sessions', async () => {
    const tx = {
      authChallenge: { findFirst: vi.fn().mockResolvedValue({ id: 'c', userId: 'user-1', attempts: 0, codeHash: '34'.repeat(32), expiresAt: new Date(Date.now() + 60_000) }), updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      user: { update: vi.fn().mockResolvedValue({}) },
      refreshSession: { updateMany: vi.fn().mockResolvedValue({ count: 2 }) },
    };
    const repo = new AuthRepository({ $transaction: (cb: (client: unknown) => unknown) => cb(tx) } as unknown as PrismaService);
    await expect(repo.resetPassword('a@example.com', '34'.repeat(32), 'new-hash')).resolves.toBe(true);
    expect(tx.user.update).toHaveBeenCalledWith({ where: { id: 'user-1' }, data: { passwordHash: 'new-hash', authVersion: { increment: 1 } } });
    expect(tx.refreshSession.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'user-1', revokedAt: null } }));
    tx.authChallenge.findFirst.mockResolvedValueOnce(null);
    await expect(repo.resetPassword('a@example.com', 'bad', 'new')).resolves.toBe(false);
  });

  it('returns null for missing, invalid, expired, or concurrently rotated sessions', async () => {
    const oldSession = { id: 'old', familyId: 'family', userId: 'user', tokenHash: 'hash', expiresAt: new Date(Date.now() + 60_000), rotatedAt: null, revokedAt: null };
    const tx = {
      refreshSession: {
        findUnique: vi.fn().mockResolvedValue(oldSession),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        create: vi.fn().mockResolvedValue({ id: 'new' }),
      },
    };
    const repo = new AuthRepository({ $transaction: (cb: (client: unknown) => unknown) => cb(tx) } as unknown as PrismaService);
    tx.refreshSession.findUnique.mockResolvedValueOnce(null);
    await expect(repo.rotateSession('old', 'hash', 'new', 'new-hash', new Date(Date.now() + 60_000))).resolves.toBeNull();
    await expect(repo.rotateSession('old', 'wrong', 'new', 'new-hash', new Date(Date.now() + 60_000))).resolves.toBeNull();
    await expect(repo.rotateSession('old', 'hash', 'new', 'new-hash', new Date(Date.now() + 60_000))).resolves.toBeNull();
    expect(tx.refreshSession.create).not.toHaveBeenCalled();
  });

  it('creates a new refresh session when rotation succeeds', async () => {
    const old = { id: 'old', familyId: 'family', userId: 'user', tokenHash: 'hash', expiresAt: new Date(Date.now() + 60_000), rotatedAt: null, revokedAt: null };
    const tx = {
      refreshSession: {
        findUnique: vi.fn().mockResolvedValue(old),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        create: vi.fn().mockResolvedValue({ id: 'new' }),
      },
    };
    const repo = new AuthRepository({ $transaction: (cb: (client: unknown) => unknown) => cb(tx) } as unknown as PrismaService);
    await expect(repo.rotateSession('old', 'hash', 'new', 'new-hash', new Date(Date.now() + 60_000))).resolves.toBe('user');
    expect(tx.refreshSession.create).toHaveBeenCalledWith({ data: expect.objectContaining({ id: 'new', familyId: 'family', userId: 'user', tokenHash: 'new-hash' }) });
  });
});
