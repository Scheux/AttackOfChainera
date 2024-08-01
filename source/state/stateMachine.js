export const StateMachine = function(context) {
    this.currentState = null;
    this.previousState = null;
    this.nextState = null;
    this.context = context;
    this.states = new Map();

    if(!context) {
        console.warn(`No context given to state machine!`);
    }
}

StateMachine.prototype.hasState = function(stateID) {
    return this.states.has(stateID);
}

StateMachine.prototype.setNextState = function(stateID) {
    const nextState = this.states.get(stateID);

    if(nextState) {
        this.nextState = nextState;
        this.goToNextState();
    } else {
        console.warn(`State (${stateID}) does not exist!`);
    }
}

StateMachine.prototype.update = function(gameContext) {
    if(this.currentState !== null) {
        this.currentState.update(this, gameContext);
    }
}

StateMachine.prototype.onEventEnter = function(...event) {
    if(this.currentState !== null) {
        this.currentState.onEventEnter(this, ...event);
    }
}

StateMachine.prototype.changeState = function(state) {
    if(this.currentState !== null) {
       this.currentState.exit(this);
       this.previousState = this.currentState;
    }

    this.currentState = state;
    this.currentState.enter(this);
}

StateMachine.prototype.goToPreviousState = function() {
    this.changeState(this.previousState);
}

StateMachine.prototype.goToNextState = function() {
    this.changeState(this.nextState);
}

StateMachine.prototype.getContext = function() {
    return this.context;
}

StateMachine.prototype.addState = function(stateID, state) {
    if(!state) {
        console.warn(`State (${stateID}) is not defined!`);
        return;
    }

    if(this.hasState(stateID)) {
        console.warn(`State (${stateID}) already exists!`);
    }

    this.states.set(stateID, state);
}

StateMachine.prototype.removeState = function(stateID) {
    if(!this.states.has(stateID)) {
        console.warn(`State (${stateID}) is not registered!`);
        return;
    }

    this.states.delete(stateID);
}

StateMachine.prototype.reset = function() {
    this.currentState = null;
    this.previousState = null;
    this.nextState = null;
}