import { AIModels, InferenceContext } from '../inferutils/config.types';
import { runModel } from '../inferutils/runModel';

export interface UserIntent {
  primaryIntent: string;
  secondaryIntents: string[];
  uiExpectation?: 'low' | 'medium' | 'high';
}

export async function decomposeIntent(
  query: string,
  inferenceContext: InferenceContext,
  env: Env,
): Promise<UserIntent> {

  const prompt = `
Extract structured intent from the user request.

User request:
"${query}"

Return JSON only:
{
  "primaryIntent": "...",
  "secondaryIntents": ["..."],
  "uiExpectation": "low|medium|high"
}
`;

  const res = await runModel({
    name: AIModels.GEMINI_2_5_FLASH_LITE,
    temperature: 0,
    max_tokens: 500,
    prompt,
    inferenceContext,
    env,
  });

  return JSON.parse(res.text);
}
