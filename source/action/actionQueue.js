import { StateMachine } from "../state/stateMachine.js";
import { QueueStateIdle } from "./queueStateIdle.js";
import { QueueStateProcessing } from "./queueStateProcessing.js";

export const ActionQueue = function() {
    this.queuedActions = [];
    this.currentAction = null;
    this.isSkippingAction = false;
    this.maxSize = 20;

    this.states = new StateMachine(this);
    this.states.addState(ActionQueue.IDLE, new QueueStateIdle());
    this.states.addState(ActionQueue.PROCESSING, new QueueStateProcessing());
}

ActionQueue.IDLE = 0;
ActionQueue.PROCESSING = 1;

ActionQueue.prototype.workStart = function() {
    this.states.setNextState(ActionQueue.IDLE);
}

ActionQueue.prototype.workEnd = function() {
    this.states.currentState = null;
    this.queuedActions.length = 0;
    this.currentAction = null;
}

ActionQueue.prototype.update = function(gameContext) {
    this.states.update(gameContext);
}

ActionQueue.prototype.next = function() {
    if(this.queuedActions.length === 0) {
        this.currentAction = null;
    } else {
        this.currentAction = this.queuedActions.shift();
    }

    return this.currentAction;
}

ActionQueue.prototype.queueAction = function(action) {
    if(this.queuedActions.length > this.maxSize) {
        return;
    }

    if(action) {
        this.queuedActions.push(action);
    }
}

ActionQueue.prototype.queuePriorityAction = function(action) {
    if(action) {
        this.queuedActions.unshift(action);
    }
}

ActionQueue.prototype.getCurrentAction = function() {
    return this.currentAction;
}

ActionQueue.prototype.isEmpty = function() {
    return this.queuedActions.length === 0;
}

ActionQueue.prototype.isRunning = function() {
    return this.queuedActions.length !== 0 || this.currentAction !== null;
}

ActionQueue.prototype.setMaxSize = function(maxSize) {
    this.maxSize = maxSize;
}

ActionQueue.prototype.getNextValidAction = function(gameContext) {
    while(!this.next() || !this.currentAction.isValid(gameContext)) {
        if(this.isEmpty()) {
            this.currentAction = null;
            break;
        }
    }

    return this.currentAction;
}

ActionQueue.prototype.endProcessing = function() {
    this.states.setNextState(ActionQueue.IDLE);
}

ActionQueue.prototype.skipAction = function() {
    if(this.isRunning()) {
        this.isSkippingAction = true;
        this.endProcessing();
    }
}