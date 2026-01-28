import { 
    AgentActionKey, 
    AgentConfig, 
    AgentConstraintConfig, 
    AIModels,
    AllModels,
    LiteModels,
    RegularModels,
} from "./config.types";
import { env } from 'cloudflare:workers';

// Common configs - these are good defaults
const COMMON_AGENT_CONFIGS = {
    screenshotAnalysis: {
        name: AIModels.DISABLED,
        reasoning_effort: 'medium' as const,
        max_tokens: 8000,
        temperature: 1,
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
    },
    realtimeCodeFixer: {
        name: AIModels.DEEPSEEK_CHAT_V3_2,
        reasoning_effort: 'low' as const,
        max_tokens: 32000,
        temperature: 0.2,
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
    },
    fastCodeFixer: {
        name: AIModels.DISABLED,
        reasoning_effort: undefined,
        max_tokens: 64000,
        temperature: 0.0,
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
    },
    templateSelection: {
        name: AIModels.DEEPSEEK_CHAT_V3_2,
        max_tokens: 2000,
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
        temperature: 1,
    },
} as const;

const SHARED_IMPLEMENTATION_CONFIG = {
    reasoning_effort: 'low' as const,
    max_tokens: 48000,
    temperature: 1,
    fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
};

//======================================================================================
// ATTENTION! Platform config requires specific API keys and Cloudflare AI Gateway setup.
//======================================================================================
/* 
These are the configs used at build.cloudflare.dev 
You may need to provide API keys for these models in your environment or use 
Cloudflare AI Gateway unified billing for seamless model access without managing multiple keys.
*/
const PLATFORM_AGENT_CONFIG: AgentConfig = {
    ...COMMON_AGENT_CONFIGS,
    blueprint: {
        name: AIModels.DEEPSEEK_REASONER_V3_2,
        reasoning_effort: 'high',
        max_tokens: 20000,
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
        temperature: 1.0,
    },
    projectSetup: {
        name: AIModels.DEEPSEEK_CHAT_V3_2,
        reasoning_effort: 'medium',
        max_tokens: 8000,
        temperature: 1,
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
    },
    phaseGeneration: {
        name: AIModels.DEEPSEEK_REASONER_V3_2,
        reasoning_effort: 'medium',
        max_tokens: 8000,
        temperature: 1,
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
    },
    firstPhaseImplementation: {
        name: AIModels.DEEPSEEK_REASONER_V3_2,
        ...SHARED_IMPLEMENTATION_CONFIG,
    },
    phaseImplementation: {
        name: AIModels.DEEPSEEK_REASONER_V3_2,
        ...SHARED_IMPLEMENTATION_CONFIG,
    },
    conversationalResponse: {
        name: AIModels.DEEPSEEK_CHAT_V3_2,
        reasoning_effort: 'low',
        max_tokens: 4000,
        temperature: 1,
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
    },
    deepDebugger: {
        name: AIModels.DEEPSEEK_REASONER_V3_2,
        reasoning_effort: 'high',
        max_tokens: 8000,
        temperature: 1,
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
    },
    fileRegeneration: {
        name: AIModels.DEEPSEEK_CHAT_V3_2,
        reasoning_effort: 'low',
        max_tokens: 16000,
        temperature: 0.0,
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
    },
    agenticProjectBuilder: {
        name: AIModels.DEEPSEEK_REASONER_V3_2,
        reasoning_effort: 'medium',
        max_tokens: 8000,
        temperature: 1,
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
    },
    sandboxCompliance: {
        name: AIModels.DEEPSEEK_CHAT_V3_2,
        reasoning_effort: 'low',
        max_tokens: 8000,
        temperature: 0.5,
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
    },
};

//======================================================================================
// Default DeepSeek-only config (most likely used in your deployment)
//======================================================================================
/* These are the default out-of-the box DeepSeek-only models used when PLATFORM_MODEL_PROVIDERS is not set */
const DEFAULT_AGENT_CONFIG: AgentConfig = {
    ...COMMON_AGENT_CONFIGS,
    templateSelection: {
        name: AIModels.DEEPSEEK_CHAT_V3_2,
        max_tokens: 2000,
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
        temperature: 0.6,
    },
    blueprint: {
        name: AIModels.DEEPSEEK_REASONER_V3_2,
        reasoning_effort: 'high',
        max_tokens: 64000,
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
        temperature: 1,
    },
    projectSetup: {
        name: AIModels.DEEPSEEK_REASONER_V3_2,
        ...SHARED_IMPLEMENTATION_CONFIG,
    },
    phaseGeneration: {
        name: AIModels.DEEPSEEK_REASONER_V3_2,
        ...SHARED_IMPLEMENTATION_CONFIG,
    },
    firstPhaseImplementation: {
        name: AIModels.DEEPSEEK_REASONER_V3_2,
        ...SHARED_IMPLEMENTATION_CONFIG,
    },
    phaseImplementation: {
        name: AIModels.DEEPSEEK_REASONER_V3_2,
        ...SHARED_IMPLEMENTATION_CONFIG,
    },
    conversationalResponse: {
        name: AIModels.DEEPSEEK_CHAT_V3_2,
        reasoning_effort: 'low',
        max_tokens: 4000,
        temperature: 0,
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
    },
    deepDebugger: {
        name: AIModels.DEEPSEEK_REASONER_V3_2,
        reasoning_effort: 'high',
        max_tokens: 8000,
        temperature: 1,
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
    },
    fileRegeneration: {
        name: AIModels.DEEPSEEK_CHAT_V3_2,
        reasoning_effort: 'low',
        max_tokens: 32000,
        temperature: 1,
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
    },
    agenticProjectBuilder: {
        name: AIModels.DEEPSEEK_REASONER_V3_2,
        reasoning_effort: 'high',
        max_tokens: 8000,
        temperature: 1,
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
    },
    sandboxCompliance: {
        name: AIModels.DEEPSEEK_CHAT_V3_2,
        reasoning_effort: 'low',
        max_tokens: 8000,
        temperature: 0.5,
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
    },
};

export const AGENT_CONFIG: AgentConfig = env.PLATFORM_MODEL_PROVIDERS 
    ? PLATFORM_AGENT_CONFIG 
    : DEFAULT_AGENT_CONFIG;


export const AGENT_CONSTRAINTS: Map<AgentActionKey, AgentConstraintConfig> = new Map([
	['fastCodeFixer', {
		allowedModels: new Set([AIModels.DISABLED]),
		enabled: true,
	}],
	['realtimeCodeFixer', {
		allowedModels: new Set([AIModels.DISABLED]),
		enabled: true,
	}],
	['fileRegeneration', {
		allowedModels: new Set(AllModels),
		enabled: true,
	}],
	['phaseGeneration', {
		allowedModels: new Set(AllModels),
		enabled: true,
	}],
	['projectSetup', {
		allowedModels: new Set([...RegularModels, AIModels.DEEPSEEK_REASONER_V3_2]),
		enabled: true,
	}],
	['conversationalResponse', {
		allowedModels: new Set(RegularModels),
		enabled: true,
	}],
	['templateSelection', {
		allowedModels: new Set(LiteModels),
		enabled: true,
	}],
]);