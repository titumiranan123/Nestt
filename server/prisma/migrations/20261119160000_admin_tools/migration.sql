CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(24) NOT NULL CHECK (type IN ('ORDER', 'PAYMENT', 'STOCK', 'REVIEW', 'CUSTOMER')),
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  target VARCHAR(500),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS admin_notifications_user_created_idx ON admin_notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_notifications_unread_idx ON admin_notifications(user_id, is_read) WHERE is_read = FALSE;

CREATE TABLE IF NOT EXISTS admin_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  status VARCHAR(12) NOT NULL CHECK (status IN ('RUNNING', 'SUCCESS', 'FAILED')),
  size_bytes BIGINT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  backup_type VARCHAR(16) NOT NULL DEFAULT 'Manual' CHECK (backup_type IN ('Automatic', 'Manual')),
  storage_path TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  error TEXT
);
CREATE INDEX IF NOT EXISTS admin_backups_started_idx ON admin_backups(started_at DESC);
