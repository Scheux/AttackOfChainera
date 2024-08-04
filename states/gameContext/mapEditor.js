import { State } from "../../source/state/state.js";

export const MapEditorState = function() {
    State.call(this);
}

MapEditorState.prototype = Object.create(State.prototype);
MapEditorState.prototype.constructor = MapEditorState;

MapEditorState.prototype.enter = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { mapLoader, client, uiManager, spriteManager, renderer } = gameContext;
    const { cursor, musicPlayer } = client;

    musicPlayer.loadTrack("surfing");
    uiManager.parseUI("MAP_EDITOR", gameContext);
    uiManager.addClick("BUTTON_SAVE", (gameContext, element) => gameContext.client.musicPlayer.playTrack("surfing", 0.2));
    uiManager.addClick("BUTTON_CREATE", (gameContext, element) => mapLoader.cacheMap(mapLoader.createEmptyMap("none", 30, 30)));
    uiManager.addClick("BUTTON_LOAD", async (gameContext, element) => {
        const loadSuccess = await gameContext.loadMap("none");

        if(!loadSuccess){
            return;
        };

        spriteManager.createSprite("enemy", true);
        spriteManager.createSprite("enemy_two", true);
        uiManager.addFetch("TEXT_FPS", element => element.setText(`FPS: ${Math.round(renderer.smoothedFPS)}`));
    });
    uiManager.addClick("BUTTON_RESIZE", (gameContext, element) => true); /*uiManager.unparseElement(uiManager.userInterfaces["MAP_EDITOR"]["TEXT_LOAD"]*//*gameContext.uiManager.unparseUI("MAP_EDITOR", gameContext)*/
}

MapEditorState.prototype.exit = function(stateMachine) {
    const { mapLoader } = stateMachine.getContext();
}

