const { spawnSync } = require('node:child_process');

const result = spawnSync(
  'pnpm',
  ['exec', 'expo', 'prebuild', '--platform', 'android', '--clean'],
  {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      CI: '1',
    },
  },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
