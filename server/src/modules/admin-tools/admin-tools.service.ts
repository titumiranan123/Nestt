import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir, stat, unlink } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { PrismaService } from '../../database/prisma.service.js';

type NotificationRow = { id: string; type: string; title: string; body: string; createdAt: Date; isRead: boolean; target: string | null };
type BackupRow = { id: string; filename: string; status: 'SUCCESS' | 'RUNNING' | 'FAILED'; sizeBytes: number | null; startedAt: Date; finishedAt: Date | null; type: 'Automatic' | 'Manual'; storagePath: string | null; error: string | null };

@Injectable()
export class AdminToolsService {
  constructor(private readonly db: PrismaService) {}

  async notifications(userId: string) {
    const rows = await this.db.$queryRaw<NotificationRow[]>(Prisma.sql`SELECT id::text AS id, type, title, body, created_at AS "createdAt", is_read AS "isRead", target FROM admin_notifications WHERE user_id = ${userId}::uuid ORDER BY created_at DESC LIMIT 500`);
    return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
  }

  async markRead(userId: string, id: string) {
    const rows = await this.db.$queryRaw<Array<{ id: string }>>(Prisma.sql`UPDATE admin_notifications SET is_read = TRUE, read_at = COALESCE(read_at, NOW()) WHERE id = ${id}::uuid AND user_id = ${userId}::uuid RETURNING id::text AS id`);
    if (!rows[0]) throw new NotFoundException('Notification not found.');
    return { id, isRead: true };
  }

  async markAllRead(userId: string) {
    const rows = await this.db.$queryRaw<Array<{ id: string }>>(Prisma.sql`UPDATE admin_notifications SET is_read = TRUE, read_at = COALESCE(read_at, NOW()) WHERE user_id = ${userId}::uuid AND is_read = FALSE RETURNING id::text AS id`);
    return { updated: rows.length };
  }

  async auditLogs() {
    const rows = await this.db.auditLog.findMany({ include: { actor: { select: { name: true, role: true } } }, orderBy: { createdAt: 'desc' }, take: 500 });
    return rows.map((row) => ({ id: row.id, actor: row.actor?.name ?? row.actorEmail, role: row.actor?.role ?? 'CUSTOMER', action: row.action.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()), resource: [row.resource, row.resourceId].filter(Boolean).join(' · ') || 'System', status: row.status?.toUpperCase() === 'FAILED' ? 'FAILED' : 'SUCCESS', ip: row.ipAddress ?? '—', createdAt: row.createdAt.toISOString(), details: [row.oldData ? `Previous: ${JSON.stringify(row.oldData)}` : '', row.newData ? `Current: ${JSON.stringify(row.newData)}` : ''].filter(Boolean).join('\n') || `Recorded action: ${row.action}.` }));
  }

  async backups() {
    const rows = await this.db.$queryRaw<BackupRow[]>(Prisma.sql`SELECT id::text AS id, filename, status, size_bytes::float8 AS "sizeBytes", started_at AS "startedAt", finished_at AS "finishedAt", backup_type AS type, storage_path AS "storagePath", error FROM admin_backups ORDER BY started_at DESC LIMIT 500`);
    return rows.map((row) => this.presentBackup(row));
  }

  async createBackup(actorId: string) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new ServiceUnavailableException('Database backup is unavailable: DATABASE_URL is not configured.');
    const url = new URL(databaseUrl);
    if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') throw new ServiceUnavailableException('Database backup requires PostgreSQL.');
    const id = randomUUID();
    const startedAt = new Date();
    const storageRoot = resolve(process.env.BACKUP_STORAGE_PATH || join(process.cwd(), 'storage', 'backups'));
    await mkdir(storageRoot, { recursive: true });
    const filename = `nestt-db-${startedAt.toISOString().replaceAll(':', '-').replaceAll('.', '-')}.sql`;
    const filePath = join(storageRoot, `${id}.sql`);
    await this.db.$executeRaw(Prisma.sql`INSERT INTO admin_backups (id, filename, status, backup_type, started_at, created_by) VALUES (${id}::uuid, ${filename}, 'RUNNING', 'Manual', ${startedAt}, ${actorId}::uuid)`);
    try {
      const child = spawn(process.env.PG_DUMP_PATH || 'pg_dump', ['--no-password', '--format=plain', '--host', url.hostname, '--port', url.port || '5432', '--username', decodeURIComponent(url.username), '--dbname', decodeURIComponent(url.pathname.slice(1))], { env: { ...process.env, PGPASSWORD: decodeURIComponent(url.password), PGSSLMODE: url.searchParams.get('sslmode') || process.env.PGSSLMODE || 'prefer' }, stdio: ['ignore', 'pipe', 'pipe'] });
      let stderr = '';
      child.stderr.setEncoding('utf8').on('data', (chunk: string) => { stderr = `${stderr}${chunk}`.slice(-4000); });
      const output = pipeline(child.stdout!, createWriteStream(filePath, { flags: 'wx' }));
      const result = new Promise<void>((resolvePromise, rejectPromise) => {
        child.once('error', rejectPromise);
        child.once('close', (code) => code === 0 ? resolvePromise() : rejectPromise(new Error(stderr || `pg_dump exited with status ${code}`)));
      });
      await Promise.all([output, result]);
      const file = await stat(filePath);
      const finishedAt = new Date();
      const rows = await this.db.$queryRaw<BackupRow[]>(Prisma.sql`UPDATE admin_backups SET status = 'SUCCESS', size_bytes = ${file.size}, finished_at = ${finishedAt}, storage_path = ${filePath} WHERE id = ${id}::uuid RETURNING id::text AS id, filename, status, size_bytes::float8 AS "sizeBytes", started_at AS "startedAt", finished_at AS "finishedAt", backup_type AS type, storage_path AS "storagePath", error`);
      return this.presentBackup(rows[0]);
    } catch (error) {
      await unlink(filePath).catch(() => undefined);
      const message = error instanceof Error ? error.message : 'Database backup failed.';
      await this.db.$executeRaw(Prisma.sql`UPDATE admin_backups SET status = 'FAILED', finished_at = NOW(), error = ${message.slice(0, 1000)} WHERE id = ${id}::uuid`);
      return { id, filename, status: 'FAILED', size: '—', startedAt: startedAt.toISOString(), finishedAt: new Date().toISOString(), type: 'Manual', error: message };
    }
  }

  async backupFile(id: string) {
    const rows = await this.db.$queryRaw<BackupRow[]>(Prisma.sql`SELECT id::text AS id, filename, status, size_bytes::float8 AS "sizeBytes", started_at AS "startedAt", finished_at AS "finishedAt", backup_type AS type, storage_path AS "storagePath", error FROM admin_backups WHERE id = ${id}::uuid`);
    const row = rows[0];
    if (!row || row.status !== 'SUCCESS' || !row.storagePath) throw new NotFoundException('Backup file not found.');
    const root = resolve(process.env.BACKUP_STORAGE_PATH || join(process.cwd(), 'storage', 'backups'));
    const filePath = resolve(row.storagePath);
    if (dirname(filePath) !== root || basename(filePath) !== `${id}.sql`) throw new NotFoundException('Backup file not found.');
    return { path: filePath, filename: row.filename };
  }

  private presentBackup(row: BackupRow) {
    return { id: row.id, filename: row.filename, status: row.status, size: row.sizeBytes === null ? '—' : `${(row.sizeBytes / (1024 * 1024)).toFixed(1)} MB`, sizeBytes: row.sizeBytes, startedAt: row.startedAt.toISOString(), finishedAt: row.finishedAt?.toISOString() ?? '—', type: row.type, error: row.error };
  }
}
