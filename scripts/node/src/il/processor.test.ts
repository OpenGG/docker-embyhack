/**
 * Test suite for the IL Processor module.
 *
 * Validates the Processor's ability to handle various string concatenation scenarios.
 */
import { Processor } from "./processor.ts";

interface TestCase {
    name: string;
    input: string;
    expected: string;
}

const testCases: TestCase[] = [
    {
        name: "Simple single-line string",
        input: 'IL_005d: /* 72 | (70)02BBC8 */ ldstr "systemid" /* 7002BBC8 */',
        expected: 'IL_005d: /* 72 | (70)02BBC8 */ ldstr "systemid" /* 7002BBC8 */',
    },
    {
        name: "Two-line string concatenation",
        input: `IL_0079: /* 72 | (70)02BBDA */ ldstr "https://www.mb3admin.com/admin/service/package/ret"+
"rieveall\\?includeAllRuntimes=true" /* 7002BBDA */`,
        expected: 'IL_0079: /* 72 | (70)02BBDA */ ldstr "https://www.mb3admin.com/admin/service/package/retrieveall\\?includeAllRuntimes=true" /* 7002BBDA */',
    },
    {
        name: "Multi-line concatenation",
        input: `IL_0080: ldstr "part1"+
"part2"+
"part3" /* end */`,
        expected: 'IL_0080: ldstr "part1part2part3" /* end */',
    },
    {
        name: "Preserve escape sequences",
        input: `IL_0090: ldstr "line1\\n"+
"line2\\t"+
"line3\\"" /* comment */`,
        expected: 'IL_0090: ldstr "line1\\nline2\\tline3\\"" /* comment */',
    },
    {
        name: "Strings with quotes inside",
        input: `IL_0100: ldstr "He said \\"Hello\\""+
" and \\"Goodbye\\"" /* test */`,
        expected: 'IL_0100: ldstr "He said \\"Hello\\" and \\"Goodbye\\"" /* test */',
    },
    {
        name: "Multiple concatenations",
        input: `IL_0110: ldstr "first"+
"second" /* comment1 */
IL_0120: ldstr "third"
+
"fourth" /* comment2 */`,
        expected: `IL_0110: ldstr "firstsecond" /* comment1 */
IL_0120: ldstr "thirdfourth" /* comment2 */`,
    },
    {
        name: "Whitespace handling",
        input: `IL_0130: ldstr "start"  +  
   "middle"   +
"end" /* done */`,
        expected: 'IL_0130: ldstr "startmiddleend" /* done */',
    },
    {
        name: "Empty strings",
        input: `IL_0140: ldstr ""+
"content"+
"" /* test */`,
        expected: 'IL_0140: ldstr "content" /* test */',
    },
    {
        name: "Complex escape sequences",
        input: `IL_0150: ldstr "path\\\\to\\\\file\\\\"+
"name.txt" /* file path */`,
        expected: 'IL_0150: ldstr "path\\\\to\\\\file\\\\name.txt" /* file path */',
    },
    {
        name: "Mixed content",
        input: `IL_0170: ldstr "single"
IL_0180: ldstr "concat1"+
"concat2"
IL_0190: ldstr "another_single"`,
        expected: `IL_0170: ldstr "single"
IL_0180: ldstr "concat1concat2"
IL_0190: ldstr "another_single"`,
    },
    {
        name: "Mixed content with comments",
        input: `IL_0170: ldstr "single"
IL_0180: ldstr "concat1"+ /* comment */
"concat2"
IL_0190: ldstr "another_single"`,
        expected: `IL_0170: ldstr "single"
IL_0180: ldstr "concat1concat2" /* comment */
IL_0190: ldstr "another_single"`,
    },
    {
        name: "Mixed content with multiple comments",
        input: `IL_0170: ldstr "single"
IL_0180: ldstr "concat1"+ /* comment 1 */
"concat2" /* comment 2 */
+ "concat3" /* comment 3 */
IL_0190: ldstr "another_single"`,
        expected: `IL_0170: ldstr "single"
IL_0180: ldstr "concat1concat2concat3" /* comment 1 */ /* comment 2 */ /* comment 3 */
IL_0190: ldstr "another_single"`,
    },
    {
        name: "Mixed content with no comments",
        input: `IL_0170: ldstr "single"
IL_0180: ldstr "concat1"+
"concat2"
+ "concat3"
IL_0190: ldstr "another_single"`,
        expected: `IL_0170: ldstr "single"
IL_0180: ldstr "concat1concat2concat3"
IL_0190: ldstr "another_single"`,
    },
];

/**
 * Executes test cases for the IL Processor.
 *
 * Runs each test case sequentially and reports results.
 */
const runTests = async () => {
    console.log("Running IL Processor Tests...\n");

    let passed = 0;
    let failed = 0;

    const runTest = async (name: string, input: string, expected: string) => {
        try {
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

            let result = '';
            // Create a WritableStream that captures the output.
            const writable = new WritableStream({
                write(chunk) {
                    result += chunk;
                }
            });

            // Create a ReadableStream for the input.
            const readable = new ReadableStream({
                start(controller) {
                    controller.enqueue(input);
                    controller.close();
                }
            });

            // Pipe the streams together and wait for completion.
            await readable.pipeThrough(processorStream).pipeTo(writable);

            const finalResult = result;

            if (finalResult === expected) {
                console.log(`pass ${name}`);
                passed++;
            } else {
                console.log(`failed ${name}`);
                console.log(`    Expected: ${expected}`);
                console.log(`    Got:      ${finalResult}`);
                failed++;
            }
        } catch (error) {
            console.log(`failed ${name} - Error: ${error}`);
            console.log(error.stack);
            failed++;
        }
    };

    // Sequentially run all test cases.
    for (const testCase of testCases) {
        await runTest(testCase.name, testCase.input, testCase.expected);
    }

    console.log(`\nResults: ${passed} passed, ${failed} failed`);
    return { passed, failed, total: passed + failed };
};

runTests();