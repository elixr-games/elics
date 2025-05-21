import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as elics from './elics.js';
import * as ecsy from './ecsy.js';
import * as becsy from './becsy.js';
import * as koota from './koota.js';
import * as bitecs from './bitecs.js';

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
		bitecs.packedIteration,
	],
	[
		'Simple Iteration',
		elics.simpleIteration,
		ecsy.simpleIteration,
		becsy.simpleIteration,
		koota.simpleIteration,
		bitecs.simpleIteration,
	],
	[
		'Fragmented Iteration',
		elics.fragmentedIteration,
		ecsy.fragmentedIteration,
		becsy.fragmentedIteration,
		koota.fragmentedIteration,
		bitecs.fragmentedIteration,
	],
	[
		'Entity Cycle',
		elics.entityCycle,
		ecsy.entityCycle,
		becsy.entityCycle,
		koota.entityCycle,
		bitecs.entityCycle,
	],
	[
		'Add / Remove',
		elics.addRemove,
		ecsy.addRemove,
		becsy.addRemove,
		koota.addRemove,
		bitecs.addRemove,
	],
];

const results = [];

async function run() {
	for (const [name, elicsFn, ecsyFn, becsyFn, kootaFn, bitecsFn] of suites) {
		try {
			let elicsSum = 0;
			let ecsySum = 0;
			let becsySum = 0;
			let kootaSum = 0;
			let bitecsSum = 0;

			for (let i = 0; i < RUNS; i++) {
				elicsSum += elicsFn();
				ecsySum += ecsyFn();
				becsySum += await becsyFn();
				kootaSum += kootaFn();
				bitecsSum += bitecsFn();
			}

			const elicsTime = elicsSum / RUNS;
			const ecsyTime = ecsySum / RUNS;
			const becsyTime = becsySum / RUNS;
			const kootaTime = kootaSum / RUNS;
			const bitecsTime = bitecsSum / RUNS;

			results.push({
				name,
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
		return `\n**${r.name}**:\n  - \`EliCS\u00A0\`: ${elBar} ${elBold}\n  - \`Bitecs\`: ${biBar} ${biBold}\n  - \`Koota\u00A0\`: ${koBar} ${koBold}\n  - \`Becsy\u00A0\`: ${bcBar} ${bcBold}\n  - \`Ecsy\u00A0\u00A0\`: ${ecBar} ${ecBold}`;
	});

	const before = text.slice(0, startIdx + start.length);
	const after = text.slice(endIdx);
	text = `${before}\n${lines.join('\n')}\n${after}`;
	fs.writeFileSync(readmePath, text);
}
