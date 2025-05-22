import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// Silence ecsy warnings in console
console.warn = () => {};

const RUNS = 10;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const runnerPath = path.resolve(__dirname, 'run-benchmark.js');

function runIsolated(modulePath, fnName) {
	const modPath = path.resolve(__dirname, modulePath);
	const { stdout, status, stderr } = spawnSync(
		'node',
		[runnerPath, modPath, fnName],
		{ encoding: 'utf8' },
	);
	if (status !== 0) {
		throw new Error(stderr.trim() || 'Failed to run benchmark');
	}
	return parseFloat(stdout);
}

const suites = [
	{
		name: 'Packed Iteration (5 queries)',
		description:
			'1,000 entities each with components A\u2013E. Each query doubles the value stored in a single component.',
		fn: 'packedIteration',
	},
	{
		name: 'Simple Iteration',
		description:
			'4,000 entities split across various component sets; three systems swap component values.',
		fn: 'simpleIteration',
	},
	{
		name: 'Fragmented Iteration',
		description:
			'26 component types (A\u2013Z) with 100 entities each plus a Data component. Two queries double the Data and Z values.',
		fn: 'fragmentedIteration',
	},
	{
		name: 'Entity Cycle',
		description:
			'1,000 entities repeatedly spawn and then destroy entities with a B component.',
		fn: 'entityCycle',
	},
	{
		name: 'Add / Remove',
		description: '1,000 entities each add then remove a B component.',
		fn: 'addRemove',
	},
];

const results = [];

async function run() {
	for (const suite of suites) {
		const { name, description, fn } = suite;
		try {
			let elicsSum = 0;
			let ecsySum = 0;
			let becsySum = 0;
			let kootaSum = 0;
			let bitecsSum = 0;

			for (let i = 0; i < RUNS; i++) {
				elicsSum += runIsolated('./elics.js', fn);
				ecsySum += runIsolated('./ecsy.js', fn);
				becsySum += runIsolated('./becsy.js', fn);
				kootaSum += runIsolated('./koota.js', fn);
				bitecsSum += runIsolated('./bitecs.js', fn);
			}

			const elicsTime = elicsSum / RUNS;
			const ecsyTime = ecsySum / RUNS;
			const becsyTime = becsySum / RUNS;
			const kootaTime = kootaSum / RUNS;
			const bitecsTime = bitecsSum / RUNS;

			results.push({
				name,
				description,
				elicsTime,
				ecsyTime,
				becsyTime,
				kootaTime,
				bitecsTime,
			});

			console.log(`${name}:`);
			console.log(`  EliCS: ${elicsTime.toFixed(2)} ms`);
			console.log(`  ecsy:  ${ecsyTime.toFixed(2)} ms`);
			console.log(`  becsy: ${becsyTime.toFixed(2)} ms`);
			console.log(`  koota: ${kootaTime.toFixed(2)} ms`);
			console.log(`  bitecs:${bitecsTime.toFixed(2)} ms`);
		} catch (err) {
			console.error(`Failed to run ${name}:`, err.message);
		}
	}

	updateBenchmarksPage(results);
}

await run();

function updateBenchmarksPage(res) {
	const benchPath = path.resolve(
		path.dirname(fileURLToPath(import.meta.url)),
		'..',
		'docs',
		'benchmarks.md',
	);
	let text = fs.readFileSync(benchPath, 'utf8');
	const start = '<!-- benchmark-start -->';
	const end = '<!-- benchmark-end -->';
	const startIdx = text.indexOf(start);
	const endIdx = text.indexOf(end);
	if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
		console.error('Benchmark markers missing in docs/benchmarks.md');
		return;
	}

	const sections = res.map((r) => {
		const el = r.elicsTime.toFixed(2);
		const ec = r.ecsyTime.toFixed(2);
		const bc = r.becsyTime.toFixed(2);
		const ko = r.kootaTime.toFixed(2);
		const bi = r.bitecsTime.toFixed(2);
		const fastest = Math.min(
			r.elicsTime,
			r.ecsyTime,
			r.becsyTime,
			r.kootaTime,
			r.bitecsTime,
		);
		const slowest = Math.max(
			r.elicsTime,
			r.ecsyTime,
			r.becsyTime,
			r.kootaTime,
			r.bitecsTime,
		);
		const elBar = '█'.repeat(Math.floor((r.elicsTime / slowest) * 20));
		const ecBar = '█'.repeat(Math.floor((r.ecsyTime / slowest) * 20));
		const bcBar = '█'.repeat(Math.floor((r.becsyTime / slowest) * 20));
		const koBar = '█'.repeat(Math.floor((r.kootaTime / slowest) * 20));
		const biBar = '█'.repeat(Math.floor((r.bitecsTime / slowest) * 20));
		const elBold = r.elicsTime === fastest ? `**${el} ms**` : `${el} ms`;
		const ecBold = r.ecsyTime === fastest ? `**${ec} ms**` : `${ec} ms`;
		const bcBold = r.becsyTime === fastest ? `**${bc} ms**` : `${bc} ms`;
		const koBold = r.kootaTime === fastest ? `**${ko} ms**` : `${ko} ms`;
		const biBold = r.bitecsTime === fastest ? `**${bi} ms**` : `${bi} ms`;
		return `\n## ${r.name}\n\n${r.description} Benchmark results:\n\n- \`EliCS\u00A0\`: ${elBar} ${elBold}\n- \`Bitecs\`: ${biBar} ${biBold}\n- \`Koota\u00A0\`: ${koBar} ${koBold}\n- \`Becsy\u00A0\`: ${bcBar} ${bcBold}\n- \`Ecsy\u00A0\u00A0\`: ${ecBar} ${ecBold}`;
	});

	const before = text.slice(0, startIdx + start.length);
	const after = text.slice(endIdx);
	text = `${before}\n${sections.join('\n')}\n${after}`;
	fs.writeFileSync(benchPath, text);
}
