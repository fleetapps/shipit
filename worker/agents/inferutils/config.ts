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
        name: AIModels.DEEPSEEK_CHAT_V3_2,
        reasoning_effort: undefined,
        max_tokens: 8000,
        temperature: 0,
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
    },
    realtimeCodeFixer: {
        name: AIModels.DEEPSEEK_CHAT_V3_2,
        reasoning_effort: undefined,
        temperature: 0,
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
    },
    fastCodeFixer: {
        name: AIModels.DEEPSEEK_CHAT_V3_2,
        reasoning_effort: undefined,
        temperature: 0,
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
    },
    templateSelection: {
        name: AIModels.DEEPSEEK_CHAT_V3_2,
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
        temperature: 0,
    },
} as const;

const SHARED_IMPLEMENTATION_CONFIG = {
    reasoning_effort: 'low' as const,
    max_tokens: 12000,
    temperature: 0.1,
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
        temperature: 0.25,
    },
    projectSetup: {
        name: AIModels.DEEPSEEK_CHAT_V3_2,
        reasoning_effort: 'low',
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
    },
    phaseGeneration: {
        name: AIModels.DEEPSEEK_REASONER_V3_2,
        reasoning_effort: 'low',
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
        max_tokens: 2000,
        temperature: 0.4,
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
    },
    deepDebugger: {
        name: AIModels.DEEPSEEK_REASONER_V3_2,
        reasoning_effort: 'high',
        max_tokens: 8000,
        temperature: 0.2,
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
    },
    fileRegeneration: {
        name: AIModels.DEEPSEEK_CHAT_V3_2,
        reasoning_effort: 'low',
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
    },
    agenticProjectBuilder: {
        name: AIModels.DEEPSEEK_REASONER_V3_2,
        reasoning_effort: 'medium',
        max_tokens: 4000,
        temperature: 0.2,
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
    },
};

//======================================================================================
// Default DeepSeek config
//======================================================================================
/* These are the default DeepSeek models used when PLATFORM_MODEL_PROVIDERS is not set */
const DEFAULT_AGENT_CONFIG: AgentConfig = {
    ...COMMON_AGENT_CONFIGS,
    templateSelection: {
        name: AIModels.DEEPSEEK_CHAT_V3_2,
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
    },
    blueprint: {
        name: AIModels.DEEPSEEK_REASONER_V3_2,
        reasoning_effort: 'high',
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
        temperature: 0.3,
    },
    projectSetup: {
        name: AIModels.DEEPSEEK_CHAT_V3_2,
        reasoning_effort: 'low',
        temperature: 0.2,
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
    },
    phaseGeneration: {
        name: AIModels.DEEPSEEK_REASONER_V3_2,
        reasoning_effort: 'low',
        temperature: 0.2,
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
    },
    firstPhaseImplementation: {
        name: AIModels.DEEPSEEK_REASONER_V3_2,
        reasoning_effort: 'low',
        temperature: 0.2,
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
    },
    phaseImplementation: {
        name: AIModels.DEEPSEEK_REASONER_V3_2,
        reasoning_effort: 'low',
        max_tokens: 12000,
        temperature: 0.2,
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
    },
    conversationalResponse: {
        name: AIModels.DEEPSEEK_CHAT_V3_2,
        temperature: 0,
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
    },
    deepDebugger: {
        name: AIModels.DEEPSEEK_REASONER_V3_2,
        reasoning_effort: 'high',
        temperature: 0,
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
    },
    fileRegeneration: {
        name: AIModels.DEEPSEEK_CHAT_V3_2,
        reasoning_effort: 'low',
        temperature: 0,
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
    },
    agenticProjectBuilder: {
        name: AIModels.DEEPSEEK_REASONER_V3_2,
        reasoning_effort: 'medium',
        temperature: 0.2,
        fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
    },
};

export const AGENT_CONFIG: AgentConfig = env.PLATFORM_MODEL_PROVIDERS 
    ? PLATFORM_AGENT_CONFIG 
    : DEFAULT_AGENT_CONFIG;


export const AGENT_CONSTRAINTS: Map<AgentActionKey, AgentConstraintConfig> = new Map([
	['fastCodeFixer', {
		allowedModels: new Set([AIModels.DEEPSEEK_CHAT_V3_2]),
		enabled: true,
	}],
	['realtimeCodeFixer', {
		allowedModels: new Set(LiteModels),
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
		allowedModels: new Set([...RegularModels, ...LiteModels]),
		enabled: true,
	}],
	['conversationalResponse', {
		allowedModels: new Set(RegularModels),
		enabled: true,
	}],
	['templateSelection', {
		allowedModels: new Set([AIModels.DEEPSEEK_CHAT_V3_2, ...LiteModels]),
		enabled: true,
	}],
]);

// export const TOKEN_GUARDS = {
//     HARD_LIMIT: 50_000,      // absolute stop
//     SOFT_LIMIT: 35_000,      // start degrading
//   };
  
// export function applyTokenGuard(
//     config: ModelConfig,
//     context: InferenceContext,
//   ): ModelConfig {
//     const spent = context.spentTokens ?? 0;
  
//     // 🔴 HARD STOP
//     if (spent >= TOKEN_GUARDS.HARD_LIMIT) {
//       throw new Error('Token budget exceeded');
//     }
  
//     // 🟡 SOFT DEGRADE
//     if (spent >= TOKEN_GUARDS.SOFT_LIMIT) {
//       return {
//         ...config,
//         temperature: Math.min(config.temperature ?? 0.2, 0.1),
//         reasoning_effort: undefined,
//         max_tokens: Math.min(config.max_tokens ?? 4000, 4000),
//         name: LiteModels.includes(config.name as AIModels)
//           ? config.name
//           : AIModels.GEMINI_2_5_FLASH_LITE,
//         fallbackModel: undefined, // 🔒 disable escalation
//       };
//     }
  
//     return config;
//   }
  