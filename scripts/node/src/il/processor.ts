/**
 * Processor for Intermediate Language (IL) strings.
 *
 * This class processes IL code to combine concatenated string literals into single strings.
 * It handles complex scenarios including multi-line concatenations, escape sequences, and comments.
 */
enum State {
    Default,
    CommentStart,
    InComment,
    CommentEnd,
    LdstrFound,
    InString,
    StringEnd,
    StringConcat
}

/**
 * Context for processing ldstr (load string) operations.
 */
interface LdstrContext {
    firstQuotePos: number;
    combinedString: string;
    stringBuffer: string;
    pendingComments: string[];
    isEscaped: boolean;
    trailingWhitespace: string;
}

export class Processor {
    private state: State = State.Default;
    private returnState: State = State.Default;

    // Encapsulated context for the current ldstr operation. It's non-null only during an ldstr operation.
    private ldstrContext: LdstrContext | null = null;

    // Buffers for general processing
    private heldBuffer: string = '';
    private commentBuffer: string = '';

    /**
     * Finalizes the current ldstr operation and returns the processed string.
     *
     * @returns The processed string with concatenated parts
     */
    private finalize(): string {
        // If not in an ldstr operation, just return whatever is held.
        if (!this.ldstrContext) {
            const leftover = this.heldBuffer;
            this.heldBuffer = '';
            return leftover;
        }

        // Reconstruct the line from the held buffer parts and the combined string.
        const prefix = this.heldBuffer.substring(0, this.ldstrContext.firstQuotePos + 1);

        const allComments = this.ldstrContext.pendingComments.map(c => c.trim()).join(' ');
        const commentsWithSpace = allComments ? ' ' + allComments : '';

        const output = prefix + this.ldstrContext.combinedString + '"' + commentsWithSpace + this.ldstrContext.trailingWhitespace;

        // Reset state by clearing the context
        this.ldstrContext = null;
        this.heldBuffer = '';

        return output;
    }

    // --- State Handler Methods ---

    private handleDefault(char: string): string | null {
        this.heldBuffer += char;
        if (this.heldBuffer.endsWith('ldstr')) {
            // Flush content preceding the "ldstr" token.
            const output = this.heldBuffer.substring(0, this.heldBuffer.length - 5);
            this.heldBuffer = 'ldstr';

            // Start a new ldstr operation.
            this.state = State.LdstrFound;
            this.ldstrContext = {
                firstQuotePos: -1,
                combinedString: '',
                stringBuffer: '',
                pendingComments: [],
                isEscaped: false,
                trailingWhitespace: ''
            };
            return output;
        }
        return null;
    }

    private handleCommentStart(char: string): string | null {
        if (char === '*') {
            this.commentBuffer += '*';
            this.state = State.InComment;
        } else {
            // Not a block comment. Revert and re-process.
            this.state = this.returnState;
            this.heldBuffer += this.commentBuffer + char; // The '/' was in commentBuffer
            this.commentBuffer = '';
        }
        return null;
    }

    private handleInComment(char: string): void {
        this.commentBuffer += char;
        if (char === '*') {
            this.state = State.CommentEnd;
        }
    }

    private handleCommentEnd(char: string): void {
        this.commentBuffer += char;
        if (char === '/') {
            if (this.ldstrContext) {
                this.ldstrContext.pendingComments.push(this.commentBuffer);
            } else {
                this.heldBuffer += this.commentBuffer;
            }
            this.commentBuffer = '';
            this.state = this.returnState;
        } else if (char !== '*') {
            this.state = State.InComment;
        }
    }

    private handleLdstrFound(char: string): void {
        this.heldBuffer += char;
        if (char === '"' && this.ldstrContext) {
            this.ldstrContext.firstQuotePos = this.heldBuffer.length - 1;
            this.state = State.InString;
        }
    }

    private handleInString(char: string): void {
        if (!this.ldstrContext) return; // Should not happen in this state

        if (this.ldstrContext.isEscaped) {
            this.ldstrContext.stringBuffer += '\\' + char;
            this.ldstrContext.isEscaped = false;
        } else if (char === '\\') {
            this.ldstrContext.isEscaped = true;
        } else if (char === '"') {
            this.ldstrContext.combinedString += this.ldstrContext.stringBuffer;
            this.ldstrContext.stringBuffer = ''; // Clear for next part
            this.state = State.StringEnd;
        } else {
            this.ldstrContext.stringBuffer += char;
        }
    }

    private handleStringEnd(char: string): string | null {
        if (!this.ldstrContext) return null; // Should not happen

        if (char === '+') {
            this.ldstrContext.trailingWhitespace = '';
            this.state = State.StringConcat;
        } else if (char === '/') {
            this.ldstrContext.trailingWhitespace = '';
            this.returnState = this.state;
            this.state = State.CommentStart;
            this.commentBuffer = '/';
        } else if (!/\s/.test(char)) {
            // New instruction starts, finalize the old one.
            const output = this.finalize();
            this.state = State.Default;
            // Re-process the character in the new default state.
            return output + (this.handleDefault(char) || '');
        } else {
            this.ldstrContext.trailingWhitespace += char;
        }
        return null;
    }

    private handleStringConcat(char: string): string | null {
        if (char === '"') {
            this.state = State.InString;
        } else if (char === '/') {
            this.returnState = this.state;
            this.state = State.CommentStart;
            this.commentBuffer = '/';
        } else if (!/\s/.test(char) && char !== '+') {
            const output = this.finalize();
            this.state = State.Default;
            // Re-process the character in the new default state.
            return output + (this.handleDefault(char) || '');
        }
        return null;
    }

    /**
     * Processes a character through the state machine.
     *
     * @param char - Character to process
     * @returns Processed output if available, otherwise null
     */
    private processChar(char: string): string | null {
        switch (this.state) {
            case State.Default: return this.handleDefault(char);
            case State.CommentStart: return this.handleCommentStart(char);
            case State.InComment: this.handleInComment(char); break;
            case State.CommentEnd: this.handleCommentEnd(char); break;
            case State.LdstrFound: this.handleLdstrFound(char); break;
            case State.InString: this.handleInString(char); break;
            case State.StringEnd: return this.handleStringEnd(char);
            case State.StringConcat: return this.handleStringConcat(char);
        }
        return null;
    }

    /**
     * Processes input chunks to combine concatenated strings.
     *
     * @param chunk - Input string or null for end-of-stream
     * @returns Processed output string
     */
    public write(chunk: string | null): string {
        let output = '';

        if (chunk === null) {
            // End of stream signal, finalize everything.
            return this.finalize();
        }

        for (const char of chunk) {
            const result = this.processChar(char);
            if (result) {
                output += result;
            }
        }

        // Flush any content that is not part of an ongoing ldstr operation
        if (this.ldstrContext === null) {
            output += this.heldBuffer;
            this.heldBuffer = '';
        }

        return output;
    }
}
