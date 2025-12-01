import { ErrorResult, ToolDefinition } from '../types';
type FeedbackArgs = {
    message: string;
    type: 'bug' | 'feedback';
    severity?: 'low' | 'medium' | 'high';
    context?: string;
};
type FeedbackResult = {
    success: true;
    eventId: string;
} | ErrorResult;
export declare const toolFeedbackDefinition: ToolDefinition<FeedbackArgs, FeedbackResult>;
export {};
