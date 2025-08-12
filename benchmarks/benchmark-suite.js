import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const RUNS = 25;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const runnerPath = path.resolve(__dirname, 'isolated-runner.js');

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
			'Tests optimal-case iteration performance with 1,000 entities each containing components A\u2013E. Five separate systems iterate through dense, homogeneous entity populations, doubling component values. Simulates high-performance scenarios like physics calculations where all entities share identical component layouts. Stresses query iteration speed, component data access patterns, and memory bandwidth utilization with tightly packed archetype storage.',
		fn: 'packedIteration',
	},
	{
		name: 'Simple Iteration',
		description:
			"Evaluates heterogeneous entity processing with 4,000 entities distributed across multiple component combinations (A+B, C+D, C+E, etc.). Three systems perform value swapping between different component pairs, testing the ECS's ability to efficiently handle overlapping queries on diverse entity archetypes. Simulates typical game scenarios where different entity types require different processing systems, stressing archetype diversity handling and query filtering efficiency.",
		fn: 'simpleIteration',
	},
	{
		name: 'Fragmented Iteration',
		description:
			'Challenges sparse data handling with 26 different component types (A\u2013Z) where only 100 entities exist per archetype, plus a shared Data component across all entities. Two systems process the sparse entity populations, testing fragmented memory access and archetype management. Simulates complex games with many specialized entity types (items, NPCs, effects, UI elements) where entity populations are spread thin across numerous archetypes, stressing cache efficiency and memory layout optimization.',
		fn: 'fragmentedIteration',
	},
	{
		name: 'Fragmented Iteration (256 comps)',
		description:
			'Like Fragmented Iteration but with 256 distinct component types and a high-index query (Comp255). Stresses multiword bitmasks and query matching across 8 words while keeping sparse archetypes (100 entities per component). Useful to compare scaling beyond 32 components across engines.',
		fn: 'fragmentedIteration256',
	},
	{
		name: 'Entity Cycle',
		description:
			'Benchmarks dynamic entity lifecycle management by repeatedly creating and destroying entities. Starting with 1,000 entities containing component A, each iteration spawns new entities with component B for every A entity, then destroys all B entities. Tests entity creation/destruction performance, memory pool efficiency, and query invalidation overhead. Simulates high-frequency spawning scenarios like bullet systems, particle effects, or temporary game objects, stressing memory allocation/deallocation and archetype table management.',
		fn: 'entityCycle',
	},
	{
		name: 'Add / Remove',
		description:
			'Tests component mutation performance through rapid archetype transitions. Starting with 1,000 entities containing component A, the system continuously adds component B to A entities, then removes B from entities that have both A and B. Simulates dynamic state changes like status effects, equipment modifications, or temporary buffs where entities frequently migrate between archetypes. Stresses component addition/removal efficiency, archetype migration performance, and query membership update overhead.',
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
				elicsSum += runIsolated('./elics.bench.js', fn);
				ecsySum += runIsolated('./ecsy.bench.js', fn);
				becsySum += runIsolated('./becsy.bench.js', fn);
				kootaSum += runIsolated('./koota.bench.js', fn);
				bitecsSum += runIsolated('./bitecs.bench.js', fn);
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
