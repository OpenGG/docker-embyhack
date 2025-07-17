
/**
 * @typedef {Object} Config
 * @property {string[]} targetUrls - List of URLs to be replaced
 * @property {string} replacementUrl - URL to replace matches with
 * @property {RegExp} urlPattern - Regex pattern to match mb3admin URLs
 */

/**
 * @type {Config}
 */
export const config = {
    targetUrls: process.env.EMBY_TARGET_URL?.split(' ') || [],
    replacementUrl: process.env.EMBY_REPLACEMENT_URL || '',
    matchUrlPattern: /https:\/\/[^\/]*mb3admin\.com[\/a-zA-Z0-9]+/g,
    replaceUrlPattern: /^https:\/\/[^/]+\//,
};

export const validateConfig = () => {
    if (!config.targetUrls.length) {
        throw new Error('EMBY_TARGET_URL environment variable must be set and not empty');
    }
    if (!config.replacementUrl) {
        throw new Error('EMBY_REPLACEMENT_URL environment variable must be set');
    }
    if (!config.replacementUrl.startsWith('http') || !config.replacementUrl.endsWith('/')) {
        throw new Error('EMBY_REPLACEMENT_URL must start with "https" and end with "/"');
    }
}