import { ScreenshotAnalysisType } from '../schemas';
import { ScreenshotData } from '../core/types';
import { AgentOperation, OperationOptions } from './common';
export interface ScreenshotAnalysisInput {
    screenshotData: ScreenshotData;
}
export declare class ScreenshotAnalysisOperation extends AgentOperation<ScreenshotAnalysisInput, ScreenshotAnalysisType> {
    execute(input: ScreenshotAnalysisInput, options: OperationOptions): Promise<ScreenshotAnalysisType>;
}
