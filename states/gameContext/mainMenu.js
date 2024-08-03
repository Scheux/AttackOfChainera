import { State } from "../../source/state/state.js";

export const MainMenuState = function() {
    State.call(this);
}

MainMenuState.prototype = Object.create(State.prototype);
MainMenuState.prototype.constructor = MainMenuState;

MainMenuState.prototype.enter = function(stateMachine) {
    const gameContext = stateMachine.getContext();
}

MainMenuState.prototype.exit = function(stateMachine) {
    const gameContext = stateMachine.getContext();
}