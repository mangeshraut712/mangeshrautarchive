import { lstat, realpath, readdir, rm } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';

export async function inspectDeletion(root, target) {
  const canonicalRoot = await realpath(root);
  const absolute = resolve(root, target);
  const rel = relative(canonicalRoot, absolute);
  if (!rel || rel === '..' || rel.startsWith(`..${sep}`) || resolve(absolute) === sep) {
    throw new Error('WARNING: deletion target is outside the repository or is its root. Refusing.');
  }
  if (
    rel.split(sep).some(part => ['.git', '.env', 'node_modules', '.venv', 'venv'].includes(part))
  ) {
    throw new Error('WARNING: deletion target contains protected data. Refusing.');
  }
  let current = canonicalRoot;
  for (const part of rel.split(sep)) {
    current = resolve(current, part);
    let info;
    try {
      info = await lstat(current);
    } catch (error) {
      if (error.code === 'ENOENT') return { path: absolute, count: 0, exists: false };
      throw error;
    }
    if (info.isSymbolicLink())
      throw new Error('WARNING: deletion target traverses a symbolic link. Refusing.');
  }
  const canonical = await realpath(absolute);
  if (!canonical.startsWith(canonicalRoot + sep))
    throw new Error('WARNING: deletion escaped the repository. Refusing.');
  async function countFiles(path) {
    const info = await lstat(path);
    if (info.isSymbolicLink())
      throw new Error('WARNING: cleanup contains a symbolic link. Refusing.');
    if (!info.isDirectory()) return 1;
    let count = 0;
    for (const name of await readdir(path)) count += await countFiles(resolve(path, name));
    return count;
  }
  return { path: canonical, count: await countFiles(canonical), exists: true };
}

export async function removeWithinRepo(root, target, { apply = false } = {}) {
  const plan = await inspectDeletion(root, target);
  console.log(
    `WARNING: ${apply ? 'permanent deletion' : 'dry-run only'}: ${plan.path} (${plan.count} files).`
  );
  if (apply && plan.exists) {
    // Recheck immediately before mutation; refuse links rather than following them.
    await inspectDeletion(root, target);
    await rm(plan.path, { recursive: true, force: false });
  }
  return plan;
}
