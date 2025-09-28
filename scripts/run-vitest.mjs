#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const vitestPackagePath = require.resolve('vitest/package.json');
const vitestPackage = require(vitestPackagePath);
const vitestBinRelative =
  typeof vitestPackage.bin === 'string' ? vitestPackage.bin : vitestPackage.bin?.vitest;
if (!vitestBinRelative) {
  console.error('Unable to locate Vitest binary path from package metadata.');
  process.exit(1);
}
const vitestBin = path.resolve(path.dirname(vitestPackagePath), vitestBinRelative);

let enableCoverage = false;
if (process.env.CI) {
  enableCoverage = true;
} else {
  try {
    require.resolve('@vitest/coverage-v8');
    enableCoverage = true;
  } catch (error) {
    console.warn('Skipping coverage because @vitest/coverage-v8 is not installed.');
  }
}

const args = ['run'];
if (enableCoverage) {
  args.push('--coverage');
}

const child = spawn(process.execPath, [vitestBin, ...args], {
  stdio: 'inherit'
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});
