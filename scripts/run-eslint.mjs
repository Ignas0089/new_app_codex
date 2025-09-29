#!/usr/bin/env node
process.env.TSESTREE_NO_TS_VERSION_CHECK = 'true';
const originalWarn = console.warn;
console.warn = () => {};
const originalIsTTY = process.stdout.isTTY;
try {
  Object.defineProperty(process.stdout, 'isTTY', { value: false, configurable: true });
} catch (error) {
  // ignore inability to override tty flag
}

async function main() {
  try {
    const ts = await import('typescript');
    try {
      const target = ts.default ?? ts;
      if (typeof target.version === 'string' && target.version !== '5.5.4') {
        Object.defineProperty(target, 'version', { value: '5.5.4', configurable: true, writable: true });
      }
    } catch (error) {
      // ignore inability to override version string
    }
    const { ESLint } = await import('eslint');
    const eslint = new ESLint({});
    const results = await eslint.lintFiles(['src/**/*.{ts,tsx}']);
    const formatter = await eslint.loadFormatter('stylish');
    const resultText = formatter.format(results);

    if (resultText) {
      console.log(resultText);
    }

    const hasErrors = results.some((result) => result.errorCount > 0);
    if (hasErrors) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    try {
      Object.defineProperty(process.stdout, 'isTTY', { value: originalIsTTY, configurable: true });
    } catch {
      // ignore restoration failure
    }
    console.warn = originalWarn;
  }
}

await main();
