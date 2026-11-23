import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { localEnvironment } from '../safety/local-environment.mjs';
const root = fileURLToPath(new URL('../../', import.meta.url));
const [command, ...args] = process.argv.slice(2);
if (!command) throw new Error('A local command is required.');
const env = localEnvironment(process.env, root);
const child = spawn(command, args, { cwd: root, env, stdio: 'inherit' });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('error', () => {
  console.error('Local command could not start.');
  process.exitCode = 1;
});
child.on('exit', code => {
  process.exitCode = code ?? 1;
});
