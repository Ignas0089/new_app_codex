#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

const args = process.argv.slice(2);
const filteredArgs = args.filter((arg) => arg !== '--runInBand');
const require = createRequire(import.meta.url);
const vitestPackagePath = require.resolve('vitest/package.json');
const cliPath = path.join(path.dirname(vitestPackagePath), 'dist/cli.js');

const child = spawn(process.execPath, [cliPath, 'run', '--minWorkers', '1', '--maxWorkers', '1', ...filteredArgs], {
  stdio: 'inherit'
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
