
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
    targetUrls: process.env.emby_target_urls?.split(' ') || [],
    replacementUrl: process.env.emby_replacement_url || '',
    matchUrlPattern: /https:\/\/[^\/]*mb3admin\.com[\/a-zA-Z0-9]+/g,
    replaceUrlPattern: /^https:\/\/[^/]+\//,
    stashJS: process.env.path_stash_js || '',
    stashDLL: process.env.path_stash_dll || '',
    decompiledDLL: process.env.path_decompiled || '',
    manifestJS: process.env.file_manifest_js || '',
    manifestDLL: process.env.file_manifest_dll || '',
    pathOutput: process.env.path_output || '',
};

export const validateConfig = () => {
    if (!config.targetUrls.length) {
        throw new Error('TARGET_URLS environment variable must be set and not empty');
    }
    if (!config.replacementUrl) {
        throw new Error('REPLACEMENT_URL environment variable must be set');
    }
    if (!config.replacementUrl.startsWith('http') || !config.replacementUrl.endsWith('/')) {
        throw new Error('REPLACEMENT_URL must start with "https" and end with "/"');
    }
    if (!config.stashJS) {
        throw new Error('STASH_JS environment variable must be set');
    }
    if (!config.decompiledDLL) {
        throw new Error('DECOMPILED_DLL environment variable must be set');
    }
    if (!config.manifestJS) {
        throw new Error('MANIFEST_JS environment variable must be set');
    }
    if (!config.manifestDLL) {
        throw new Error('MANIFEST_DLL environment variable must be set');
    }
    if (!config.pathOutput) {
        throw new Error('PATH_OUTPUT environment variable must be set');
    }
}