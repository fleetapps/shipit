import { TemplateListResponse } from '../../services/sandbox/sandboxTypes';
import { InferenceContext } from '../inferutils/config.types';
import { TemplateSelection } from '../../agents/schemas';
import type { ImageAttachment } from '../../types/image-attachment';
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
export declare function selectTemplate({ env, query, availableTemplates, inferenceContext, images }: SelectTemplateArgs): Promise<TemplateSelection>;
export {};
