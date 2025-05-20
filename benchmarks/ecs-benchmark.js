import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as elics from './elics.js';
import * as ecsy from './ecsy.js';
import * as becsy from './becsy.js';

// Silence ecsy warnings in console
console.warn = () => {};

const suites = [
    ['Packed Iteration', elics.packedIteration, ecsy.packedIteration, becsy.packedIteration],
    ['Simple Iteration', elics.simpleIteration, ecsy.simpleIteration, becsy.simpleIteration],
    ['Fragmented Iteration', elics.fragmentedIteration, ecsy.fragmentedIteration, becsy.fragmentedIteration],
    ['Entity Cycle', elics.entityCycle, ecsy.entityCycle, becsy.entityCycle],
    ['Add / Remove', elics.addRemove, ecsy.addRemove, becsy.addRemove],
];

const results = [];

async function run() {
    for (const [name, elicsFn, ecsyFn, becsyFn] of suites) {
        try {
            const elicsTime = elicsFn();
            const ecsyTime = ecsyFn();
            const becsyTime = await becsyFn();
            results.push({ name, elicsTime, ecsyTime, becsyTime });

            console.log(`${name}:`);
            console.log(`  EliCS: ${elicsTime.toFixed(2)} ms`);
            console.log(`  ecsy:  ${ecsyTime.toFixed(2)} ms`);
            console.log(`  becsy: ${becsyTime.toFixed(2)} ms`);
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
        const fastest = Math.min(r.elicsTime, r.ecsyTime, r.becsyTime);
        const slowest = Math.max(r.elicsTime, r.ecsyTime, r.becsyTime);
        const elBar = '█'.repeat(Math.floor((r.elicsTime / slowest) * 20));
        const ecBar = '█'.repeat(Math.floor((r.ecsyTime / slowest) * 20));
        const bcBar = '█'.repeat(Math.floor((r.becsyTime / slowest) * 20));
        const elBold = r.elicsTime === fastest ? `**${el} ms**` : `${el} ms`;
        const ecBold = r.ecsyTime === fastest ? `**${ec} ms**` : `${ec} ms`;
        const bcBold = r.becsyTime === fastest ? `**${bc} ms**` : `${bc} ms`;
        return `- **${r.name}**:\n  - EliCS: ${elBar.padEnd(20, ' ')} ${elBold}\n  - Ecsy:  ${ecBar.padEnd(20, ' ')} ${ecBold}\n  - Becsy: ${bcBar.padEnd(20, ' ')} ${bcBold}`;
    });

    const before = text.slice(0, startIdx + start.length);
    const after = text.slice(endIdx);
    text = `${before}\n${lines.join('\n')}\n${after}`;
    fs.writeFileSync(readmePath, text);
}
