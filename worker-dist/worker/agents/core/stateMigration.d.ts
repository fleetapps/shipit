import { CodeGenState } from './state';
import { StructuredLogger } from '../../logger';
export declare class StateMigration {
    static migrateIfNeeded(state: CodeGenState, logger: StructuredLogger): CodeGenState | null;
}
