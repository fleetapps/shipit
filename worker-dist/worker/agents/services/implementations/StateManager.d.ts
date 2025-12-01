import { IStateManager } from '../interfaces/IStateManager';
import { CodeGenState } from '../../core/state';
/**
 * State manager implementation for Durable Objects
 * Works with the Agent's state management
 */
export declare class StateManager implements IStateManager {
    private getStateFunc;
    private setStateFunc;
    constructor(getStateFunc: () => CodeGenState, setStateFunc: (state: CodeGenState) => void);
    getState(): Readonly<CodeGenState>;
    setState(newState: CodeGenState): void;
    updateField<K extends keyof CodeGenState>(field: K, value: CodeGenState[K]): void;
    batchUpdate(updates: Partial<CodeGenState>): void;
}
