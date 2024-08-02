import { State } from "../state/state.js";

export const QueueStateProcessing = function() {
    State.call(this);
}

QueueStateProcessing.prototype = Object.create(State.prototype);
QueueStateProcessing.prototype.constructor = QueueStateProcessing;

QueueStateProcessing.prototype.enter = function(stateMachine) {
    const actionQueue = stateMachine.getContext();
    const action = actionQueue.getCurrentAction();

    action.onStart();
}

QueueStateProcessing.prototype.exit = function(stateMachine) {
    const actionQueue = stateMachine.getContext();
    const action = actionQueue.getCurrentAction();

    if(actionQueue.isSkippingAction) {
        actionQueue.isSkippingAction = false;
        return;
    }

    action.onEnd();
}

QueueStateProcessing.prototype.update = function(stateMachine, gameContext) {
    const actionQueue = stateMachine.getContext();
    const action = actionQueue.getCurrentAction();

    action.onUpdate(gameContext);

    if(action.isFinished) {
        actionQueue.endProcessing();
    }
}