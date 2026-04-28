const { execSync } = require('node:child_process');

const run = command => {
  execSync(command, { stdio: 'inherit' });
};

const isLinux = process.platform === 'linux';

if (isLinux) {
  try {
    run('npx playwright install --with-deps chromium');
    process.exit(0);
  } catch {
    console.warn(
      '[playwright-postinstall] Failed to install system dependencies. Retrying browser-only install.'
    );
  }
}

run('npx playwright install chromium');
