const { execSync } = require('node:child_process');

const run = command => {
  execSync(command, { stdio: 'inherit' });
};

if (process.env.SKIP_PLAYWRIGHT_POSTINSTALL === '1') {
  console.log('[playwright-postinstall] Skipped via SKIP_PLAYWRIGHT_POSTINSTALL=1');
  process.exit(0);
}

const isCi = String(process.env.CI || '')
  .trim()
  .toLowerCase() === 'true';
const strictMode = process.env.PLAYWRIGHT_POSTINSTALL_STRICT === '1';
const isLinux = process.platform === 'linux';
let installed = false;

if (isLinux) {
  try {
    run('npx playwright install --with-deps chromium');
    installed = true;
    process.exit(0);
  } catch {
    console.warn(
      '[playwright-postinstall] Failed to install system dependencies. Retrying browser-only install.'
    );
  }
}

try {
  run('npx playwright install chromium');
  installed = true;
} catch (error) {
  if (strictMode) {
    throw error;
  }

  const mode = isCi ? 'CI' : 'non-CI';
  console.warn(
    `[playwright-postinstall] Browser install failed in ${mode} mode. Continuing without failing install.`
  );
}

if (!installed) {
  console.warn(
    '[playwright-postinstall] WARNING: Chromium was not downloaded by postinstall. Ensure runtime image provides Chromium.'
  );
}
