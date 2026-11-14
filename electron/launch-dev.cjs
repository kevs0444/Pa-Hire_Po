/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const isCheckOnly = process.argv.includes('--check');
const mainPath = path.join(__dirname, 'main.cjs');
const preloadPath = path.join(__dirname, 'preload.cjs');

let electronBinary = null;
try {
  electronBinary = require('electron');
} catch {
  electronBinary = null;
}

if (isCheckOnly) {
  const hasFiles = fs.existsSync(mainPath) && fs.existsSync(preloadPath);
  console.log(
    JSON.stringify(
      {
        desktopWrapperReady: hasFiles,
        electronInstalled: Boolean(electronBinary),
        startUrl: process.env.ELECTRON_START_URL || 'http://localhost:3000',
      },
      null,
      2
    )
  );
  process.exit(hasFiles ? 0 : 1);
}

if (!electronBinary) {
  console.log('\n[PleaseHireMe Desktop] Electron binary is not installed yet.');
  console.log('1. Install Electron locally (devDependency only, skipped by Vercel):');
  console.log('   npm run desktop:install');
  console.log('2. Start the local server in Terminal 1: npm run dev');
  console.log('3. Launch the desktop window in Terminal 2: npm run desktop');
  console.log('\nNote: Everything can also be tested directly in your web browser at http://localhost:3000.\n');
  process.exit(0);
}

const child = spawn(String(electronBinary), ['.'], {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit',
  env: {
    ...process.env,
    ELECTRON_START_URL: process.env.ELECTRON_START_URL || 'http://localhost:3000',
  },
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
