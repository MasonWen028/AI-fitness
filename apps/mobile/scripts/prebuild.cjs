const { rmSync, existsSync } = require('node:fs');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');

const androidDir = join(process.cwd(), 'android');

function cleanAndroidDir() {
  if (!existsSync(androidDir)) {
    return;
  }

  rmSync(androidDir, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 250,
  });
}

cleanAndroidDir();

const result = spawnSync(
  'pnpm',
  ['exec', 'expo', 'prebuild', '--platform', 'android'],
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
