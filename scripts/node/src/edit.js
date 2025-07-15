import { readFileSync, writeFileSync } from 'node:fs';
import { validateConfig } from './config.js';
import { replaceContent } from './replace.js';

const filePath = process.argv[2];

/**
 * Validates required environment variables
 * @throws {Error} If required variables are missing
 */
const validate = () => {
    validateConfig()
    if (!filePath) {
        throw new Error('File path must be provided as a command line argument');
    }
};

const main = () => {
    validate();

    const content = readFileSync(filePath, 'utf8');
    const output = replaceContent(content);
    if (!output) {
        console.log(`Unchanged: ${filePath}`);
    } else {
        const outputPath = `${filePath}.EDIT`
        writeFileSync(outputPath, output, 'utf8');
        console.log(`Written file: ${outputPath}`);
    }
}

main()