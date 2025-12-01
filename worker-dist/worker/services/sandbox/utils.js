export function getTemplateImportantFiles(templateDetails, filterRedacted = true) {
    const { importantFiles, allFiles, redactedFiles } = templateDetails;
    const redactedSet = new Set(redactedFiles);
    const result = [];
    for (const [filePath, fileContents] of Object.entries(allFiles)) {
        if (importantFiles.some(pattern => filePath === pattern || filePath.startsWith(pattern))) {
            const contents = filterRedacted && redactedSet.has(filePath) ? 'REDACTED' : fileContents;
            if (contents)
                result.push({ filePath, fileContents: contents });
        }
    }
    return result;
}
export function getTemplateFiles(templateDetails) {
    return Object.entries(templateDetails.allFiles).map(([filePath, fileContents]) => ({
        filePath,
        fileContents,
    }));
}
