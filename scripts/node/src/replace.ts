
/**
 * Process content and replace matching URLs
 * @param {string} content - Content to process
 * @returns {string | null} - Processed content
 * @throws {Error} If content is invalid or processing fails
 */
export const replaceContent = ({
    content,
    matchUrlPattern,
    targetUrls,
    replaceUrlPattern,
    replacementUrl,
}: {
    content: string;
    matchUrlPattern: RegExp;
    targetUrls: string[];
    replaceUrlPattern: RegExp;
    replacementUrl: string;
}) => {
    if (typeof content !== 'string') {
        throw new TypeError('Content must be a string');
    }

    let modified = false;

    const output = content.replace(matchUrlPattern, (match) => {
        const shouldReplace = targetUrls.some(target => target.includes(match));
        modified = modified || shouldReplace;
        const replaced = shouldReplace ? match.replace(replaceUrlPattern, replacementUrl) : match;

        return replaced;
    });

    return modified ? output : null;
};
