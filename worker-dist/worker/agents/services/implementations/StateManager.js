/**
 * State manager implementation for Durable Objects
 * Works with the Agent's state management
 */
export class StateManager {
    getStateFunc;
    setStateFunc;
    constructor(getStateFunc, setStateFunc) {
        this.getStateFunc = getStateFunc;
        this.setStateFunc = setStateFunc;
    }
    getState() {
        return this.getStateFunc();
    }
    setState(newState) {
        this.setStateFunc(newState);
    }
    updateField(field, value) {
        const currentState = this.getState();
        this.setState({
            ...currentState,
            [field]: value
        });
    }
    batchUpdate(updates) {
        const currentState = this.getState();
        this.setState({
            ...currentState,
            ...updates
        });
    }
}
