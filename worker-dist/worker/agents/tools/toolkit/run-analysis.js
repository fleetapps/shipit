export function createRunAnalysisTool(agent, logger) {
    return {
        type: 'function',
        function: {
            name: 'run_analysis',
            description: 'Run static analysis (lint + typecheck), optionally scoped to given files.',
            parameters: {
                type: 'object',
                properties: {
                    files: { type: 'array', items: { type: 'string' } },
                },
                required: [],
            },
        },
        implementation: async ({ files }) => {
            logger.info('Running static analysis', {
                filesCount: files?.length || 0,
            });
            return await agent.runStaticAnalysisCode(files);
        },
    };
}
