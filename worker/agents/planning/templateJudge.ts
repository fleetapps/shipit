import { AIModels, InferenceContext } from '../inferutils/config.types';
import { runModel } from '../inferutils/runModel';
import { TemplateCandidate } from './templateTypes';

export async function judgeTemplates(
  query: string,
  a: TemplateCandidate,
  b: TemplateCandidate,
  inferenceContext: InferenceContext,
  env: Env,
) {
  const prompt = `
Two templates are close matches. Decide which is better.

User request:
"${query}"

Template A:
${JSON.stringify(a.manifest || { name: a.name }, null, 2)}

Template B:
${JSON.stringify(b.manifest || { name: b.name }, null, 2)}

Return JSON only:
{
  "winner": "template-id",
  "confidence": 0-1,
  "reason": "short explanation"
}
`;

  const res = await runModel({
    name: AIModels.GEMINI_3_PRO_PREVIEW,
    temperature: 0,
    max_tokens: 800,
    prompt,
    inferenceContext,
    env,
  });

  return JSON.parse(res.text);
}
