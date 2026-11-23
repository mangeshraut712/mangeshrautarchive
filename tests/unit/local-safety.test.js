import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { localEnvironment, assertLocalEndpoint } from '../../scripts/safety/local-environment.mjs';
import { inspectDeletion, removeWithinRepo } from '../../scripts/safety/safe-files.mjs';

test('local launcher rejects remote databases without echoing credentials', () => {
  assert.throws(
    () => localEnvironment({ SUPABASE_URL: 'https://user:fake-password@remote.invalid' }, '/repo'),
    error => !error.message.includes('fake-password')
  );
  for (const url of [
    'http://localhost:54321',
    'postgres://test@127.0.0.1/test',
    'http://[::1]:8001',
  ])
    assert.doesNotThrow(() => assertLocalEndpoint('DATABASE_URL', url));
  const env = localEnvironment(
    {
      PATH: '/bin',
      HOME: '/home/user',
      GH_TOKEN: 'dummy',
      GOOGLE_APPLICATION_CREDENTIALS: '/private/path',
      npm_config_userconfig: '/private/config',
    },
    '/repo',
    { createDirectories: false }
  );
  assert.equal(env.GH_TOKEN, undefined);
  assert.equal(env.GOOGLE_APPLICATION_CREDENTIALS, undefined);
  assert.equal(env.npm_config_userconfig, '/dev/null');
});

test('cleanup refuses escapes and links, preserves dry-run, and deletes only planned files', async () => {
  const base = await mkdtemp(join(tmpdir(), 'safe-clean-'));
  try {
    const root = join(base, 'repo');
    await mkdir(join(root, 'dist'), { recursive: true });
    await writeFile(join(root, 'dist', 'file'), 'keep');
    await writeFile(join(base, 'outside'), 'keep');
    await assert.rejects(inspectDeletion(root, '..'));
    await assert.rejects(inspectDeletion(root, '.'));
    await assert.rejects(inspectDeletion(root, '.git'));
    await symlink(base, join(root, 'linked'));
    await assert.rejects(inspectDeletion(root, 'linked/outside'));
    const plan = await removeWithinRepo(root, 'dist');
    assert.equal(plan.count, 1);
    assert.equal(await readFile(join(root, 'dist/file'), 'utf8'), 'keep');
    await removeWithinRepo(root, 'dist', { apply: true });
    assert.equal(await readFile(join(base, 'outside'), 'utf8'), 'keep');
  } finally {
    await rm(base, { recursive: true });
  }
});

test('Linux browser sockets fit inside the repository temporary path', () => {
  const root = '/home/runner/work/mangeshrautarchive/mangeshrautarchive';
  const env = localEnvironment({ HOME: '/home/runner' }, root, {
    createDirectories: false,
    platform: 'linux',
  });
  assert.equal(env.TMPDIR, `${root}/.tmp`);
  assert.ok(Buffer.byteLength(`${env.TMPDIR}/com.google.Chrome.XXXXXX/SingletonSocket`) < 108);
  assert.equal(env.PLAYWRIGHT_BROWSERS_PATH, '/home/runner/.cache/ms-playwright');
});
