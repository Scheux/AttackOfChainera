import { State } from "../../source/state/state.js";

export const MapEditorState = function() {
    State.call(this);
}

MapEditorState.prototype = Object.create(State.prototype);
MapEditorState.prototype.constructor = MapEditorState;

MapEditorState.prototype.enter = function(stateMachine) {
    const { mapLoader } = stateMachine.getContext();

    const gameMap = mapLoader.createEmptyMap("0", 30, 30);
}

MapEditorState.prototype.exit = function(stateMachine) {
    const { mapLoader } = stateMachine.getContext();
}

