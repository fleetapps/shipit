import { executeInference } from './infer';
import { createUserMessage } from './common';
import { AIModels, InferenceContext } from './config.types';

export interface RunModelParams {
  name: AIModels | string;
  temperature?: number;
  max_tokens?: number;
  prompt: string;
  inferenceContext: InferenceContext;
  env: Env;
}

export interface RunModelResponse {
  text: string;
}

export async function runModel({
  name,
  temperature = 0,
  max_tokens = 500,
  prompt,
  inferenceContext,
  env,
}: RunModelParams): Promise<RunModelResponse> {

  const result = await executeInference({
    env,
    messages: [createUserMessage(prompt)],
    agentActionName: 'templateSelection',
    context: inferenceContext,
    maxTokens: max_tokens,
    modelName: name,
    temperature,
  });

  if (!result || typeof result === 'string') {
    return { text: result || '' };
  }

  // If it's an object result, try to extract text
  if (result && typeof result === 'object' && 'object' in result) {
    return { text: JSON.stringify(result.object) };
  }

  return { text: '' };
}
