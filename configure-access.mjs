import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

// Match the upstream setup skeleton so OmniRoute can run its full migrations
// on the first boot. Existing connections and credentials are never replaced.
const setupSchema = `
  CREATE TABLE IF NOT EXISTS provider_connections (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    auth_type TEXT,
    name TEXT,
    email TEXT,
    priority INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TEXT,
    token_expires_at TEXT,
    scope TEXT,
    project_id TEXT,
    test_status TEXT,
    error_code TEXT,
    last_error TEXT,
    last_error_at TEXT,
    last_error_type TEXT,
    last_error_source TEXT,
    backoff_level INTEGER DEFAULT 0,
    rate_limited_until TEXT,
    health_check_interval INTEGER,
    last_health_check_at TEXT,
    last_tested TEXT,
    api_key TEXT,
    id_token TEXT,
    provider_specific_data TEXT,
    expires_in INTEGER,
    display_name TEXT,
    global_priority INTEGER,
    default_model TEXT,
    token_type TEXT,
    consecutive_use_count INTEGER DEFAULT 0,
    rate_limit_protection INTEGER DEFAULT 0,
    last_used_at TEXT,
    "group" TEXT,
    max_concurrent INTEGER,
    proxy_enabled INTEGER NOT NULL DEFAULT 1,
    per_key_proxy_enabled INTEGER NOT NULL DEFAULT 0,
    quota_visible INTEGER NOT NULL DEFAULT 1,
    quota_window_thresholds_json TEXT,
    rate_limit_overrides_json TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_pc_provider ON provider_connections(provider);
  CREATE INDEX IF NOT EXISTS idx_pc_active ON provider_connections(is_active);
  CREATE INDEX IF NOT EXISTS idx_pc_priority ON provider_connections(provider, priority);


CREATE TABLE IF NOT EXISTS key_value (
  namespace TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (namespace, key)
);
`;

export function configureAccess(dataDir, { open = false } = {}) {
  mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(join(dataDir, 'storage.sqlite'));
  try {
    db.exec('PRAGMA busy_timeout = 5000; BEGIN IMMEDIATE;');
    db.exec(setupSchema);
    const put = db.prepare(
      'INSERT INTO key_value (namespace, key, value) VALUES (?, ?, ?) ' +
      'ON CONFLICT(namespace, key) DO UPDATE SET value = excluded.value'
    );
    put.run('settings', 'requireLogin', JSON.stringify(!open));
    put.run('feature_flags', 'REQUIRE_API_KEY', String(!open));
    if (open) {
      put.run('settings', 'setupComplete', 'true');
      put.run('settings', 'oidcEnabled', 'false');
    }
    db.exec('COMMIT;');
  } catch (error) {
    try { db.exec('ROLLBACK;'); } catch {}
    throw error;
  } finally {
    db.close();
  }
}
