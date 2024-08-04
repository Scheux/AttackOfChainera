import { saveTemplateAsFile } from "../../source/helpers.js";
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
    const editorMapID = "MAP_EDITOR";

    musicPlayer.loadTrack("surfing");
    uiManager.parseUI("MAP_EDITOR", gameContext);
    uiManager.addClick("BUTTON_SAVE", () => {
        return; //TODO ADD SAVING;
        const stringify2DArray = array => {
            const rows = array.map(row => JSON.stringify(row));
            return `[\n${rows.join(',\n')}\n]`;
        }
    
        saveTemplateAsFile(`map_${mapID}_tilemap.json`, stringify2DArray(tileList));
    });
    uiManager.addClick("BUTTON_CREATE", () => mapLoader.cacheMap(mapLoader.createEmptyMap(editorMapID, 30, 30)));
    uiManager.addClick("BUTTON_LOAD", async () => {
        const loadSuccess = await gameContext.loadMap(editorMapID);

        if(!loadSuccess){
            return;
        }

        spriteManager.createSprite("enemy", true);
        spriteManager.createSprite("enemy_two", true);
        uiManager.addFetch("TEXT_FPS", element => element.setText(`FPS: ${Math.round(renderer.smoothedFPS)}`));
    });
    uiManager.addClick("BUTTON_RESIZE", () => uiManager.unparseElement(uiManager.userInterfaces["MAP_EDITOR"]["TEXT_LOAD"])); /*uiManager.unparseElement(uiManager.userInterfaces["MAP_EDITOR"]["TEXT_LOAD"]*//*gameContext.uiManager.unparseUI("MAP_EDITOR", gameContext)*/
}

MapEditorState.prototype.exit = function(stateMachine) {
    const { mapLoader } = stateMachine.getContext();
}

