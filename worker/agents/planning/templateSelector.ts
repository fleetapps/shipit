import { createSystemMessage, createUserMessage, createMultiModalUserMessage } from '../inferutils/common';
import { TemplateListResponse} from '../../services/sandbox/sandboxTypes';
import { createLogger } from '../../logger';
import { executeInference } from '../inferutils/infer';
import { InferenceContext } from '../inferutils/config.types';
import { RateLimitExceededError, SecurityError } from 'shared/types/errors';
import { TemplateSelection, TemplateSelectionSchema } from '../../agents/schemas';
import { generateSecureToken } from 'worker/utils/cryptoUtils';
import type { ImageAttachment } from '../../types/image-attachment';

const logger = createLogger('TemplateSelector');
interface SelectTemplateArgs {
    env: Env;
    query: string;
    availableTemplates: TemplateListResponse['templates'];
    inferenceContext: InferenceContext;
    images?: ImageAttachment[];
}

/**
 * Uses AI to select the most suitable template for a given query.
 */
export async function selectTemplate({ env, query, availableTemplates, inferenceContext, images }: SelectTemplateArgs): Promise<TemplateSelection> {
    if (availableTemplates.length === 0) {
        logger.info("No templates available for selection.");
        return { selectedTemplateName: null, reasoning: "No templates were available to choose from.", useCase: null, complexity: null, styleSelection: null, projectName: '' };
    }

    try {
        logger.info("Asking AI to select a template", { 
            query, 
            queryLength: query.length,
            imagesCount: images?.length || 0,
            availableTemplates: availableTemplates.map(t => t.name),
            templateCount: availableTemplates.length 
        });

        const templateDescriptions = availableTemplates.map((t, index) =>
            `- Template #${index + 1} \n Name - ${t.name} \n Language: ${t.language}, Frameworks: ${t.frameworks?.join(', ') || 'None'}\n ${t.description.selection}`
        ).join('\n\n');

        const systemPrompt = `You are an Expert Software Architect at Cloudflare specializing in template selection for rapid development. Your task is to select the most suitable starting template based on user requirements.

## SELECTION EXAMPLES:

**Example 1 - Game Request:**
User: "Build a 2D puzzle game with scoring"
Templates: ["react-dashboard", "react-game-starter", "vue-blog"]
Selection: "react-game-starter"
complexity: "simple"
Reasoning: "Game starter template provides canvas setup, state management, and scoring systems"

**Example 2 - Business Dashboard:**
User: "Create an analytics dashboard with charts"
Templates: ["react-dashboard", "nextjs-blog", "vanilla-js"]
Selection: "react-dashboard"
complexity: "simple" // Because single page application
Reasoning: "Dashboard template includes chart components, grid layouts, and data visualization setup"

**Example 3 - No Perfect Match:**
User: "Build a recipe sharing app"
Templates: ["react-social", "vue-blog", "angular-todo"]
Selection: "react-social"
complexity: "simple" // Because single page application
Reasoning: "Social template provides user interactions, content sharing, and community features closest to recipe sharing needs"

## SELECTION CRITERIA:
1. **Feature Alignment** - Templates with similar core functionality
2. **Tech Stack Match** - Compatible frameworks and dependencies  
3. **Architecture Fit** - Similar application structure and patterns
4. **Minimal Modification** - Template requiring least changes

## STYLE GUIDE:
- **Minimalist Design**: Clean, simple interfaces
- **Brutalism**: Bold, raw, industrial aesthetics
- **Retro**: Vintage, nostalgic design elements
- **Illustrative**: Rich graphics and visual storytelling
- **Kid_Playful**: Colorful, fun, child-friendly interfaces
- **Custom**: Design that doesn't fit any of the above categories

## RULES:
- ALWAYS select a template (never return null for selectedTemplateName)
- Ignore misleading template names - analyze actual features
- Focus on functionality over naming conventions
- Provide clear, specific reasoning for selection
- ALWAYS provide values for ALL fields - never use null
- If unsure about useCase, choose "General"
- If unsure about complexity, choose "simple"
- If unsure about styleSelection, choose "Minimalist Design"

## CRITICAL: OUTPUT FORMAT
You MUST return your response as valid JSON only. Do NOT use markdown formatting, bullet points, or any text outside of JSON.
The response must be a single JSON object matching the required schema. Even though the examples above use markdown for clarity, your actual response must be pure JSON.

## REQUIRED FIELDS (ALL must have non-null values):
- selectedTemplateName: string (exact template name from list, NEVER null)
- reasoning: string (explanation)
- useCase: string (one of the enum values, NEVER null - use "General" if unsure)
- complexity: string (one of: "simple", "moderate", "complex", NEVER null - use "simple" if unsure)
- styleSelection: string (one of the enum values, NEVER null - use "Minimalist Design" if unsure)
- projectName: string (descriptive name)`

        const userPrompt = `**User Request:** "${query}"

**Available Templates:**
${templateDescriptions}

**Task:** Select the most suitable template and provide ALL of the following fields in your JSON response:
1. **selectedTemplateName** (string): Template name (exact match from list above) - REQUIRED, never null
2. **reasoning** (string): Clear reasoning for why it fits the user's needs - REQUIRED
3. **useCase** (string): One of: "SaaS Product Website", "Dashboard", "Blog", "Portfolio", "E-Commerce", "General", "Other" - REQUIRED, use "General" if unsure, never null
4. **complexity** (string): One of: "simple", "moderate", "complex" - REQUIRED, use "simple" if unsure, never null
5. **styleSelection** (string): One of: "Minimalist Design", "Brutalism", "Retro", "Illustrative", "Kid_Playful", "Custom" - REQUIRED, use "Minimalist Design" if unsure, never null
6. **projectName** (string): Descriptive project name based on the user query - REQUIRED

**CRITICAL:** You MUST provide actual values for ALL fields. NEVER use null. If you're unsure about a field, use the default value specified above.

Analyze each template's features, frameworks, and architecture to make the best match.
${images && images.length > 0 ? `\n**Note:** User provided ${images.length} image(s) - consider visual requirements and UI style from the images.` : ''}

ENTROPY SEED: ${generateSecureToken(64)} - for unique results`;

        const userMessage = images && images.length > 0
            ? createMultiModalUserMessage(
                userPrompt,
                images.map(img => `data:${img.mimeType};base64,${img.base64Data}`),
                'high'
              )
            : createUserMessage(userPrompt);

        const messages = [
            createSystemMessage(systemPrompt),
            userMessage
        ];

        const { object: selection } = await executeInference({
            env,
            messages,
            agentActionName: "templateSelection",
            schema: TemplateSelectionSchema,
            context: inferenceContext,
            maxTokens: 2000,
        });


        logger.info(`AI template selection result: ${selection.selectedTemplateName || 'None'}, Reasoning: ${selection.reasoning}`);
        return selection;

    } catch (error) {
        logger.error("Error during AI template selection:", error);
        if (error instanceof RateLimitExceededError || error instanceof SecurityError) {
            throw error;
        }
        // Fallback to no template selection in case of error
        return { selectedTemplateName: null, reasoning: "An error occurred during the template selection process.", useCase: null, complexity: null, styleSelection: null, projectName: '' };
    }
}