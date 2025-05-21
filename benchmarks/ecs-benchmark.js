import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as elics from './elics.js';
import * as ecsy from './ecsy.js';
import * as becsy from './becsy.js';
import * as koota from './koota.js';

// Silence ecsy warnings in console
console.warn = () => {};

const RUNS = 10;

const suites = [
	[
		'Packed Iteration',
		elics.packedIteration,
		ecsy.packedIteration,
		becsy.packedIteration,
		koota.packedIteration,
	],
	[
		'Simple Iteration',
		elics.simpleIteration,
		ecsy.simpleIteration,
		becsy.simpleIteration,
		koota.simpleIteration,
	],
	[
		'Fragmented Iteration',
		elics.fragmentedIteration,
		ecsy.fragmentedIteration,
		becsy.fragmentedIteration,
		koota.fragmentedIteration,
	],
	[
		'Entity Cycle',
		elics.entityCycle,
		ecsy.entityCycle,
		becsy.entityCycle,
		koota.entityCycle,
	],
	[
		'Add / Remove',
		elics.addRemove,
		ecsy.addRemove,
		becsy.addRemove,
		koota.addRemove,
	],
];

const results = [];

async function run() {
	for (const [name, elicsFn, ecsyFn, becsyFn, kootaFn] of suites) {
		try {
			let elicsSum = 0;
			let ecsySum = 0;
			let becsySum = 0;
			let kootaSum = 0;

			for (let i = 0; i < RUNS; i++) {
				elicsSum += elicsFn();
				ecsySum += ecsyFn();
				becsySum += await becsyFn();
				kootaSum += kootaFn();
			}

			const elicsTime = elicsSum / RUNS;
			const ecsyTime = ecsySum / RUNS;
			const becsyTime = becsySum / RUNS;
			const kootaTime = kootaSum / RUNS;

			results.push({ name, elicsTime, ecsyTime, becsyTime, kootaTime });

			console.log(`${name}:`);
			console.log(`  EliCS: ${elicsTime.toFixed(2)} ms`);
			console.log(`  ecsy:  ${ecsyTime.toFixed(2)} ms`);
			console.log(`  becsy: ${becsyTime.toFixed(2)} ms`);
			console.log(`  koota: ${kootaTime.toFixed(2)} ms`);
		} catch (err) {
			console.error(`Failed to run ${name}:`, err.message);
		}
	}

	updateReadme(results);
}

await run();

function updateReadme(res) {
	const readmePath = path.resolve(
		path.dirname(fileURLToPath(import.meta.url)),
		'..',
		'README.md',
	);
	let text = fs.readFileSync(readmePath, 'utf8');
	const start = '<!-- benchmark-start -->';
	const end = '<!-- benchmark-end -->';
	const startIdx = text.indexOf(start);
	const endIdx = text.indexOf(end);
	if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
		console.error('Benchmark markers missing in README');
		return;
	}

	const lines = res.map((r) => {
		const el = r.elicsTime.toFixed(2);
		const ec = r.ecsyTime.toFixed(2);
		const bc = r.becsyTime.toFixed(2);
		const ko = r.kootaTime.toFixed(2);
		const fastest = Math.min(r.elicsTime, r.ecsyTime, r.becsyTime, r.kootaTime);
		const slowest = Math.max(r.elicsTime, r.ecsyTime, r.becsyTime, r.kootaTime);
		const elBar = '█'.repeat(Math.floor((r.elicsTime / slowest) * 20));
		const ecBar = '█'.repeat(Math.floor((r.ecsyTime / slowest) * 20));
		const bcBar = '█'.repeat(Math.floor((r.becsyTime / slowest) * 20));
		const koBar = '█'.repeat(Math.floor((r.kootaTime / slowest) * 20));
		const elBold = r.elicsTime === fastest ? `**${el} ms**` : `${el} ms`;
		const ecBold = r.ecsyTime === fastest ? `**${ec} ms**` : `${ec} ms`;
		const bcBold = r.becsyTime === fastest ? `**${bc} ms**` : `${bc} ms`;
		const koBold = r.kootaTime === fastest ? `**${ko} ms**` : `${ko} ms`;
		return `\n**${r.name}**:\n  - \`EliCS\`: ${elBar} ${elBold}\n  - \`Koota\`: ${koBar} ${koBold}\n  - \`Becsy\`: ${bcBar} ${bcBold}\n  - \`Ecsy \`: ${ecBar} ${ecBold}`;
	});

	const before = text.slice(0, startIdx + start.length);
	const after = text.slice(endIdx);
	text = `${before}\n${lines.join('\n')}\n${after}`;
	fs.writeFileSync(readmePath, text);
}
