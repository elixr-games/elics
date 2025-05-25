import fs from 'fs';
import path from 'path';

// Get the package.json file path
const packageJsonPath = path.resolve(process.cwd(), 'package.json');

// Read package.json and extract version
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const version = packageJson.version;

// Content for the version.ts file
const versionContent = `export const VERSION = '${version}';\n`;

// Define the output file path
const outputPath = path.resolve(process.cwd(), 'src/version.ts');

// Write to version.ts
fs.writeFileSync(outputPath, versionContent, 'utf-8');
console.log(`version.ts generated with VERSION=${version}`);
