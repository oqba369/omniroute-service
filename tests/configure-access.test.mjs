import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { configureAccess } from '../configure-access.mjs';

function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'omniroute-access-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}
function read(db, ns, key) {
  return db.prepare('SELECT value FROM key_value WHERE namespace = ? AND key = ?').get(ns, key)?.value;
}

test('fresh installs skip onboarding, password login, OIDC, and client keys', t => {
  const dir = fixture(t);
  configureAccess(dir, { open: true });
  const db = new DatabaseSync(join(dir, 'storage.sqlite'));
  t.after(() => db.close());
  assert.equal(read(db, 'settings', 'requireLogin'), 'false');
  assert.equal(read(db, 'settings', 'setupComplete'), 'true');
  assert.equal(read(db, 'settings', 'oidcEnabled'), 'false');
  assert.equal(read(db, 'feature_flags', 'REQUIRE_API_KEY'), 'false');
  assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE name = 'provider_connections'").get());
});

test('repeated startup overrides auth while preserving accounts and unrelated settings', t => {
  const dir = fixture(t);
  configureAccess(dir, { open: false });
  let db = new DatabaseSync(join(dir, 'storage.sqlite'));
  db.prepare("INSERT INTO provider_connections (id, provider, api_key, created_at, updated_at) VALUES (?, ?, ?, ?, ?)").run('existing', 'example', 'fixture-key', '2026-10-20', '2026-10-20');
  db.prepare("INSERT INTO key_value VALUES ('settings', 'password', ?)").run('"fixture-hash"');
  db.prepare("INSERT INTO key_value VALUES ('settings', 'unrelated', ?)").run('"keep-me"');
  db.close();
  configureAccess(dir, { open: true });
  configureAccess(dir, { open: true });
  db = new DatabaseSync(join(dir, 'storage.sqlite'));
  t.after(() => db.close());
  assert.equal(read(db, 'settings', 'requireLogin'), 'false');
  assert.equal(read(db, 'settings', 'password'), '"fixture-hash"');
  assert.equal(read(db, 'settings', 'unrelated'), '"keep-me"');
  assert.equal(db.prepare("SELECT api_key FROM provider_connections WHERE id = 'existing'").get().api_key, 'fixture-key');
});

test('turning open access off restores dashboard and client-key requirements', t => {
  const dir = fixture(t);
  configureAccess(dir, { open: true });
  configureAccess(dir, { open: false });
  const db = new DatabaseSync(join(dir, 'storage.sqlite'));
  t.after(() => db.close());
  assert.equal(read(db, 'settings', 'requireLogin'), 'true');
  assert.equal(read(db, 'feature_flags', 'REQUIRE_API_KEY'), 'true');
});
