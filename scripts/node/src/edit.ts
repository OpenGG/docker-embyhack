import { readFileSync, writeFileSync } from 'node:fs';
import { config, validateConfig } from './config.js';
import { replaceContent } from './replace.js';

const inputPath = process.argv[2];
const outputPath = process.argv[3];

/**
 * Validates required environment variables
 * @throws {Error} If required variables are missing
 */
const validate = () => {
    validateConfig()
    if (!inputPath) {
        throw new Error('Input path must be provided as a command line argument');
    }
    if (!outputPath) {
        throw new Error('Output path must be provided as a command line argument');
    }
};

const main = () => {
    validate();

    const content = readFileSync(inputPath, 'utf8');
    const output = replaceContent({
        content,
        matchUrlPattern: config.matchUrlPattern,
        targetUrls: config.targetUrls,
        replaceUrlPattern: config.replaceUrlPattern,
        replacementUrl: config.replacementUrl,
    });
    if (!output) {
        console.log(`Unchanged: ${inputPath}`);
    } else {
        writeFileSync(outputPath, output, 'utf8');
        console.log(`Written file: ${outputPath}`);
    }
}

main()