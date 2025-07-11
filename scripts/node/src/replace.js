import { config } from './config.js';

/**
 * Process content and replace matching URLs
 * @param {string} content - Content to process
 * @returns {string | null} - Processed content
 * @throws {Error} If content is invalid or processing fails
 */
export const replaceContent = (content) => {
    if (typeof content !== 'string') {
        throw new TypeError('Content must be a string');
    }

    let modified = false;

    const output = content.replace(config.matchUrlPattern, (match) => {
        const shouldReplace = config.targetUrls.some(target => target.includes(match));
        modified = modified || shouldReplace;
        const replaced = shouldReplace ? match.replace(config.replaceUrlPattern, config.replacementUrl) : match;

        return replaced;
    });

    return modified ? output : null;
};
