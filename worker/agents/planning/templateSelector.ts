import {
    createSystemMessage,
    createUserMessage,
    createMultiModalUserMessage,
  } from '../inferutils/common';
  import { TemplateCandidate } from './templateTypes';
  import { createLogger } from '../../logger';
  import { executeInference } from '../inferutils/infer';
  import { InferenceContext } from '../inferutils/config.types';
  import { RateLimitExceededError, SecurityError } from 'shared/types/errors';
  import {
    TemplateSelection,
    TemplateSelectionSchema,
    ProjectTypePredictionSchema,
  } from '../../agents/schemas';
  import { generateSecureToken } from 'worker/utils/cryptoUtils';
  import type { ImageAttachment } from '../../types/image-attachment';
  import { ProjectType } from '../core/types';
  
  import { decomposeIntent } from './intentDecomposer';
  import { scoreTemplate } from './templateScoring';
  import { judgeTemplates } from './templateJudge';
import { TemplateEvaluationSchema } from '../core/templateEvaluation.schema';
  
  const logger = createLogger('TemplateSelector');
  
  interface SelectTemplateArgs {
    env: Env;
    query: string;
    projectType?: ProjectType | 'auto';
    availableTemplates: TemplateCandidate[];
    inferenceContext: InferenceContext;
    images?: ImageAttachment[];
  }
  
  /* -------------------------------------------------------------------------- */
  /*                         PROJECT TYPE PREDICTION                             */
  /* -------------------------------------------------------------------------- */
  
  async function predictProjectType(
    env: Env,
    query: string,
    inferenceContext: InferenceContext,
    images?: ImageAttachment[]
  ): Promise<ProjectType> {
    try {
      const systemPrompt = `
  You are an expert project classifier.
  
  Classify the request into one of:
  - app
  - workflow
  - presentation
  - general
  
  Default to "app" when uncertain.
  
  Return JSON only.
  `;
  
      const userPrompt = `
  User request:
  "${query}"
  
  Return:
  {
    "projectType": "app|workflow|presentation|general",
    "reasoning": "...",
    "confidence": "high|medium|low"
  }
  `;
  
      const userMessage =
        images?.length
          ? createMultiModalUserMessage(
              userPrompt,
              images.map(i => `data:${i.mimeType};base64,${i.base64Data}`),
              'high'
            )
          : createUserMessage(userPrompt);
  
      const { object } = await executeInference({
        env,
        messages: [createSystemMessage(systemPrompt), userMessage],
        agentActionName: 'templateSelection',
        schema: ProjectTypePredictionSchema,
        context: inferenceContext,
        maxTokens: 500,
      });
  
      return object.projectType;
    } catch (err) {
      logger.warn('Project type prediction failed, defaulting to app', err);
      return 'app';
    }
  }
  
  /* -------------------------------------------------------------------------- */
  /*                        TEMPLATE ANALYSIS (LLM)                              */
  /* -------------------------------------------------------------------------- */
  
  async function analyzeTemplates(
    env: Env,
    intent: any,
    templates: TemplateCandidate[],
    inferenceContext: InferenceContext
  ) {
    const systemPrompt = `
  You are analyzing templates for architectural fit.
  
  IMPORTANT:
  - You are NOT selecting a template
  - You are NOT ranking templates
  - You are producing analysis ONLY
  
  Focus on:
  - domainMatch (0–1)
  - capabilityMatch (0–1)
  - uiFit (0–1)
  - extensibility (0–1)
  - conflictScore (0–5)
  `;
  
    const userPrompt = `
  User intent:
  ${JSON.stringify(intent, null, 2)}
  
  Templates:
${templates.map(t => `
Template:
{
  "name": "${t.name}",
  "projectType": "${t.projectType}",
  "description": ${JSON.stringify(t.description)},
  "language": "${t.language ?? 'unknown'}",
  "frameworks": ${JSON.stringify(t.frameworks ?? [])},
  "renderMode": "${t.renderMode ?? 'unknown'}",
  "manifestHints": ${JSON.stringify(t.manifest ?? {})}
}
`).join('\n')}

  
  Return structured analysis for EACH template.
  `;
  
    const { object } = await executeInference({
      env,
      messages: [
        createSystemMessage(systemPrompt),
        createUserMessage(userPrompt),
      ],
      agentActionName: 'templateSelection',
      schema: TemplateEvaluationSchema,
      context: inferenceContext,
      maxTokens: 2000,
    });
  
    return object;
  }
  
  /* -------------------------------------------------------------------------- */
  /*                               MAIN SELECTOR                                 */
  /* -------------------------------------------------------------------------- */
  
  export async function selectTemplate(
    { env, query, projectType, availableTemplates, inferenceContext, images }: SelectTemplateArgs,
    retryCount = 3
  ): Promise<TemplateSelection> {
    try {
      /* -------------------- STEP 0: INTENT -------------------- */
  
      const intent = await decomposeIntent(query, inferenceContext, env);
  
      /* -------------------- STEP 1: PROJECT TYPE -------------------- */
  
      const actualProjectType =
        projectType === 'auto'
          ? await predictProjectType(env, query, inferenceContext, images)
          : projectType ?? 'app';
  
      /* -------------------- STEP 2: FILTER TEMPLATES -------------------- */
  
      const candidates = availableTemplates
        .filter(t => !t.disabled && !t.name.toLowerCase().includes('minimal'))
        .filter(t =>
          actualProjectType === 'general'
            ? true
            : t.projectType === actualProjectType
        );
  
      if (!candidates.length) {
        return {
          selectedTemplateName: null,
          reasoning: `No templates available for ${actualProjectType}`,
          useCase: null,
          complexity: null,
          styleSelection: null,
          projectType: actualProjectType,
        };
      }
  
      if (
        (actualProjectType === 'workflow' || actualProjectType === 'presentation') &&
        candidates.length === 1
      ) {
        return {
          selectedTemplateName: candidates[0].name,
          reasoning: 'Only viable template for this project type',
          useCase: 'General',
          complexity: 'simple',
          styleSelection: null,
          projectType: actualProjectType,
        };
      }
  
      /* -------------------- STEP 3: ANALYZE -------------------- */
  
      const { results: analyses } = await analyzeTemplates(
        env,
        intent,
        candidates,
        inferenceContext
      );
      
  
      /* -------------------- STEP 4: SCORE (DETERMINISTIC) -------------------- */
  
      
      
      const scored = candidates
        .map((t: TemplateCandidate) => ({
          template: t,
          analysis: analyses.find((a: any)  => a.name === t.name),
        }))
        .filter(
          (x): x is {
            template: TemplateCandidate;
            analysis: NonNullable<typeof x.analysis>;
          } => Boolean(x.analysis)
        )
        .map(x => ({
          template: x.template,
          analysis: {
            ...x.analysis,
            templateId: x.analysis.templateId || x.template.name,
          },
          score: scoreTemplate(x.template, {
            ...x.analysis,
            templateId: x.analysis.templateId || x.template.name,
          }),
        }))
        .filter(x => x.analysis.conflictScore < 4)
        .sort((a, b) => b.score - a.score);
      
  
      if (!scored.length) {
        return {
          selectedTemplateName: candidates[0].name,
          reasoning: 'Fallback selection due to conflicts in all candidates',
          useCase: null,
          complexity: null,
          styleSelection: null,
          projectType: actualProjectType,
        };
      }
  
      /* -------------------- STEP 5: JUDGE IF NEEDED -------------------- */
  
      if (
        scored.length > 1 &&
        Math.abs(scored[0].score - scored[1].score) < 5
      ) {
        const judge = await judgeTemplates(
          query,
          scored[0].template,
          scored[1].template,
          inferenceContext,
          env
        );
  
        const winner =
            judge.winner === scored[1].template.name
                ? scored[1]
                : scored[0];

  
        scored.splice(0, scored.length, winner);
      }
  
      /* -------------------- STEP 6: FINAL SELECTION (SCHEMA) -------------------- */
  
      const finalTemplates = scored.slice(0, 3).map(s => s.template);
  
      const systemPrompt = `
  You are an expert software architect.
  
  You MUST select exactly ONE template from the allowed list.
  Return structured output only.
  `;
  
      const userPrompt = `
  User request:
  "${query}"
  
  Allowed templates:
  ${finalTemplates.map(t => t.name).join(', ')}
  
  Details:
  ${finalTemplates.map((t, i) => `
  #${i + 1} ${t.name}
  ${t.description.selection}
  `).join('\n')}
  
  Entropy: ${generateSecureToken(64)}
  `;
  
      const userMessage =
        images?.length
          ? createMultiModalUserMessage(
              userPrompt,
              images.map(i => `data:${i.mimeType};base64,${i.base64Data}`),
              'high'
            )
          : createUserMessage(userPrompt);
  
      const { object: selection } = await executeInference({
        env,
        messages: [createSystemMessage(systemPrompt), userMessage],
        agentActionName: 'templateSelection',
        schema: TemplateSelectionSchema,
        context: inferenceContext,
        maxTokens: 2000,
      });
  
      return {
        ...selection,
        projectType: actualProjectType,
      };
    } catch (err) {
      logger.error('Template selection failed', err);
  
      if (err instanceof RateLimitExceededError || err instanceof SecurityError) {
        throw err;
      }
  
      if (retryCount > 0) {
        return selectTemplate(
          { env, query, projectType, availableTemplates, inferenceContext, images },
          retryCount - 1
        );
      }
  
      return {
        selectedTemplateName: null,
        reasoning: 'Template selection failed',
        useCase: null,
        complexity: null,
        styleSelection: null,
        projectType: projectType as ProjectType,
      };
    }
  }
  