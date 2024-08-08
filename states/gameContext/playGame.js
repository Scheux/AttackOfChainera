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
    
    gameContext.createEntity("MAP", "player", 5, 5);
    gameContext.createEntity("MAP_2", "rival", 6, 5);
    await gameContext.loadMap("MAP");
    /*
    spriteManager.createSprite("player", true, "walk_down").setPositionRaw(0, 0);
    spriteManager.createSprite("player", true, "walk_up").setPositionRaw(0, 16);
    spriteManager.createSprite("player", true, "walk_right").setPositionRaw(16, 0);
    spriteManager.createSprite("player", true, "walk_left").setPositionRaw(32, 0);

    spriteManager.createSprite("player", true, "bike_down").setPositionRaw(0, 32);
    spriteManager.createSprite("player", true, "bike_up").setPositionRaw(0, 48);
    spriteManager.createSprite("player", true, "bike_right").setPositionRaw(16, 32);
    spriteManager.createSprite("player", true, "bike_left").setPositionRaw(32, 32);
    */

    //gameContext.loadMap("MAP_2");
}

PlayGameState.prototype.exit = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { uiManager } = gameContext;

    uiManager.unparseUI("PLAY_GAME", gameContext);
}