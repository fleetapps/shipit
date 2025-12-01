import { getAgentByName } from 'agents';
import { generateId } from '../utils/idGenerator';
import { SandboxSdkClient } from '../services/sandbox/sandboxSdkClient';
import { selectTemplate } from './planning/templateSelector';
import { BaseSandboxService } from '../services/sandbox/BaseSandboxService';
export async function getAgentStub(env, agentId) {
    return getAgentByName(env.CodeGenObject, agentId);
}
export async function getAgentStubLightweight(env, agentId) {
    return getAgentByName(env.CodeGenObject, agentId, {
    // props: { readOnlyMode: true }
    });
}
export async function getAgentState(env, agentId) {
    const agentInstance = await getAgentStub(env, agentId);
    return await agentInstance.getFullState();
}
export async function cloneAgent(env, agentId) {
    const agentInstance = await getAgentStub(env, agentId);
    if (!agentInstance || !await agentInstance.isInitialized()) {
        throw new Error(`Agent ${agentId} not found`);
    }
    const newAgentId = generateId();
    const newAgent = await getAgentStub(env, newAgentId);
    const originalState = await agentInstance.getFullState();
    const newState = {
        ...originalState,
        sessionId: newAgentId,
        sandboxInstanceId: undefined,
        pendingUserInputs: [],
        currentDevState: 0,
        generationPromise: undefined,
        shouldBeGenerating: false,
        // latestScreenshot: undefined,
        clientReportedErrors: [],
    };
    await newAgent.setState(newState);
    return { newAgentId, newAgent };
}
export async function getTemplateForQuery(env, inferenceContext, query, images, logger) {
    // Fetch available templates
    const templatesResponse = await SandboxSdkClient.listTemplates();
    if (!templatesResponse || !templatesResponse.success) {
        throw new Error(`Failed to fetch templates from sandbox service, ${templatesResponse.error}`);
    }
    const analyzeQueryResponse = await selectTemplate({
        env,
        inferenceContext,
        query,
        availableTemplates: templatesResponse.templates,
        images,
    });
    logger.info('Selected template', { selectedTemplate: analyzeQueryResponse });
    if (!analyzeQueryResponse.selectedTemplateName) {
        logger.error('No suitable template found for code generation');
        throw new Error('No suitable template found for code generation');
    }
    const selectedTemplate = templatesResponse.templates.find(template => template.name === analyzeQueryResponse.selectedTemplateName);
    if (!selectedTemplate) {
        logger.error('Selected template not found');
        throw new Error('Selected template not found');
    }
    const templateDetailsResponse = await BaseSandboxService.getTemplateDetails(selectedTemplate.name);
    if (!templateDetailsResponse.success || !templateDetailsResponse.templateDetails) {
        logger.error('Failed to fetch files', { templateDetailsResponse });
        throw new Error('Failed to fetch files');
    }
    const templateDetails = templateDetailsResponse.templateDetails;
    return { templateDetails, selection: analyzeQueryResponse };
}
