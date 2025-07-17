import {
    open,
} from 'node:fs/promises';

import { Writable } from 'node:stream';

import { Processor } from './il/processor'

/**
 * Processes an IL file to join split ldstr strings into single lines
 * @param {string} inputFile - Path to the input IL file
 * @returns {void}
 */
async function processIL(inputFile: string, outputFile: string) {
    try {
        // Open the input file (for reading)
        const readHandle = await open(inputFile, 'r');
        // Open the output file (for writing)
        const writeHandle = await open(outputFile, 'w+');

        // Create web streams
        const readableStream = readHandle.readableWebStream();
        const writableStream = Writable.toWeb(writeHandle.createWriteStream());

        // Create text decoder and encoder
        const textDecoder = new TextDecoderStream();
        const textEncoder = new TextEncoderStream();

        const processor = new Processor();
        // Create a TransformStream that uses the processor instance.
        const processorStream = new TransformStream({
            transform(chunk, controller) {
                const output = processor.write(chunk);
                if (output) {
                    controller.enqueue(output);
                }
            },
            flush(controller) {
                const output = processor.write(null); // Signal end of stream
                if (output) {
                    controller.enqueue(output);
                }
            }
        });

        // Build the processing pipeline
        await readableStream
            .pipeThrough(textDecoder)        // Bytes to string
            .pipeThrough(processorStream)    // Perform custom transformation
            .pipeThrough(textEncoder)        // String to bytes
            .pipeTo(writableStream);         // Write to the output file

        console.log(`✓ Processed file saved to: ${outputFile}`);

    } catch (err) {
        console.error(`❌ Error processing file: ${err.message}`);
        process.exit(1);
    }
}

const main = async () => {

    // Get the input file from command line arguments
    const inputFile = process.argv[2];
    const outputFile = process.argv[3];

    try {
        if (!inputFile) {
            throw new Error('❌ Please provide an input file as an argument.');
        }

        if (!outputFile) {
            throw new Error('❌ Please provide an output file as an argument.');
        }
        // Process the IL file
        console.log(`📝 Processing ${inputFile}...`);

        await processIL(inputFile, outputFile);
    } catch (e) {
        console.error('❌ Error processing file: ', e.message);
        process.exit(1);
    }
}

main();