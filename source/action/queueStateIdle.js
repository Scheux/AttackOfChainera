import { ActionQueue } from "./actionQueue.js";
import { State } from "../state/state.js"

export const QueueStateIdle = function() {
    State.call(this);
}

QueueStateIdle.prototype = Object.create(State.prototype);
QueueStateIdle.prototype.constructor = QueueStateIdle;

QueueStateIdle.prototype.update = function(stateMachine, gameContext) {
    const actionQueue = stateMachine.getContext();
    const nextAction = actionQueue.getNextValidAction(gameContext);

    if(nextAction) {
        stateMachine.setNextState(ActionQueue.PROCESSING);
    }
}