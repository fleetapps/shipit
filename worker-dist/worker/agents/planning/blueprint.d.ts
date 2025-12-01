import { TemplateDetails } from '../../services/sandbox/sandboxTypes';
import { Blueprint, TemplateSelection } from '../schemas';
import { InferenceContext } from '../inferutils/config.types';
import { ProcessedImageAttachment } from '../../types/image-attachment';
export interface BlueprintGenerationArgs {
    env: Env;
    inferenceContext: InferenceContext;
    query: string;
    language: string;
    frameworks: string[];
    templateDetails: TemplateDetails;
    templateMetaInfo: TemplateSelection;
    images?: ProcessedImageAttachment[];
    stream?: {
        chunk_size: number;
        onChunk: (chunk: string) => void;
    };
}
/**
 * Generate a blueprint for the application based on user prompt
 */
export declare function generateBlueprint({ env, inferenceContext, query, language, frameworks, templateDetails, templateMetaInfo, images, stream }: BlueprintGenerationArgs): Promise<Blueprint>;
