import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
execFileSync(
  process.execPath,
  [
    'node_modules/typescript/bin/tsc',
    'tests/consumer.mts',
    'tests/consumer.cts',
    '--noEmit',
    '--strict',
    '--module',
    'NodeNext',
    '--moduleResolution',
    'NodeNext',
    '--target',
    'ES2022',
  ],
  { cwd: root, stdio: 'inherit' },
);
