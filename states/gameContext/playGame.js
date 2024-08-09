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
    const saveData = {
        "entityData": [
            { "type": "player", "map": "MAP", "tileX": 2, "tileY": 3, "spriteType": "walk_down" },
            { "type": "rival", "map": "MAP", "tileX": 5, "tileY": 8, "spriteType": "walk_down" },
            { "type": "rival", "map": "MAP_2", "tileX": 5, "tileY": 6, "spriteType": "walk_down" },
            { "type": "rival", "map": "MAP_2", "tileX": 6, "tileY": 6, "spriteType": "walk_down" },
            { "type": "rival", "map": "MAP_2", "tileX": 7, "tileY": 6, "spriteType": "walk_down" }
        ],
        "mapCache": { "MAP": 1, "MAP_2": 1 },
        "mapID": "MAP",
        "playerData": null
    };

    uiManager.parseUI("PLAY_GAME", gameContext);
    gameContext.loadMap("MAP");
    //await gameContext.loadGame(saveData);

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