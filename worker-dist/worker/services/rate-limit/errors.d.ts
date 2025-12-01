import { RateLimitType } from "./config";
export interface RateLimitError {
    message: string;
    limitType: RateLimitType;
    limit?: number;
    period?: number;
    suggestions?: string[];
}
