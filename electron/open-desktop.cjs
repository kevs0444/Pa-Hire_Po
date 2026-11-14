/* eslint-disable @typescript-eslint/no-require-imports */
const http = require('node:http');
const https = require('node:https');
const path = require('node:path');
const { spawn } = require('node:child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const LIVE_URL = 'https://pa-hire-po.vercel.app';
const LOCAL_URL = process.env.ELECTRON_START_URL || 'http://localhost:3000';
const useLive = process.argv.includes('--live');
const targetUrl = useLive ? LIVE_URL : LOCAL_URL;

function checkUrlReady(url) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https://') ? https : http;
    const req = mod.get(url, { timeout: 2500 }, (res) => {
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(url, maxWaitMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    if (await checkUrlReady(url)) return true;
    await new Promise((r) => setTimeout(r, 800));
  }
  return false;
}

async function main() {
  let electronBinary = null;
  try {
    electronBinary = require('electron');
  } catch {
    electronBinary = null;
  }

  if (!electronBinary) {
    console.log('\n[Pa-Hire Po Desktop] Electron is not installed locally yet.');
    console.log('Run this once first (kept out of production Vercel builds):');
    console.log('  npm run desktop:install\n');
    console.log('Then launch Pa-Hire Po Desktop with:');
    console.log(useLive ? '  npm run desktop:live\n' : '  npm run desktop:open\n');
    process.exit(0);
  }

  let spawnedDevServer = null;

  if (!useLive) {
    const alreadyRunning = await checkUrlReady(targetUrl);
    if (!alreadyRunning) {
      console.log(`[Pa-Hire Po Desktop] Starting local server at ${targetUrl}...`);
      const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      spawnedDevServer = spawn(npmCmd, ['run', 'dev'], {
        cwd: ROOT_DIR,
        stdio: 'inherit',
        shell: process.platform === 'win32',
      });

      const ready = await waitForServer(targetUrl, 30000);
      if (!ready) {
        console.error('[Pa-Hire Po Desktop] Local server did not respond in time.');
        if (spawnedDevServer) spawnedDevServer.kill();
        process.exit(1);
      }
    } else {
      console.log(`[Pa-Hire Po Desktop] Connecting to running server at ${targetUrl}...`);
    }
  } else {
    console.log(`[Pa-Hire Po Desktop] Launching connected to live Vercel app: ${targetUrl}`);
  }

  const electronChild = spawn(String(electronBinary), ['.'], {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    env: {
      ...process.env,
      ELECTRON_START_URL: targetUrl,
    },
  });

  electronChild.on('exit', (code) => {
    if (spawnedDevServer && !spawnedDevServer.killed) {
      spawnedDevServer.kill();
    }
    process.exit(code ?? 0);
  });
}

void main();
