import { performance } from 'node:perf_hooks';
import { pathToFileURL } from 'node:url';

const [modulePath, fnName] = process.argv.slice(2);

if (!modulePath || !fnName) {
	console.error('Usage: node run-benchmark.js <modulePath> <fnName>');
	process.exit(1);
}

const moduleUrl = modulePath.startsWith('file:')
	? modulePath
	: pathToFileURL(modulePath).href;
const mod = await import(moduleUrl);
const fn = mod[fnName];
if (typeof fn !== 'function') {
	console.error(`Function ${fnName} not found in ${modulePath}`);
	process.exit(1);
}

const start = performance.now();
const result = fn();
if (result && typeof result.then === 'function') {
	await result;
}
const time = performance.now() - start;
process.stdout.write(String(time));
// Ensure the process exits even if modules keep handles open
process.exit(0);
