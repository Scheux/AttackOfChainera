import { State } from "../../source/state/state.js";

const PLAY_GAME_ID = "PLAY_GAME";

export const PlayGameState = function() {
    State.call(this);
}

PlayGameState.prototype = Object.create(State.prototype);
PlayGameState.prototype.constructor = PlayGameState;

PlayGameState.prototype.enter = async function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { uiManager, spriteManager } = gameContext;

    uiManager.parseUI("PLAY_GAME", gameContext);
    
    await gameContext.loadMap("MAP");

    spriteManager.createSprite("player", true);
}

PlayGameState.prototype.exit = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { uiManager } = gameContext;

    uiManager.unparseUI("PLAY_GAME", gameContext);
}