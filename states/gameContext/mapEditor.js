import { saveTemplateAsFile } from "../../source/helpers.js";
import { MapEditor } from "../../source/map/mapEditor.js";
import { State } from "../../source/state/state.js";
import { UIElement } from "../../source/ui/uiElement.js";

export const MapEditorState = function() {
    State.call(this);
}

MapEditorState.prototype = Object.create(State.prototype);
MapEditorState.prototype.constructor = MapEditorState;

MapEditorState.prototype.enter = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const editor = new MapEditor();
    const { mapLoader, client, uiManager, spriteManager, renderer, timer } = gameContext;
    const { cursor, musicPlayer } = client;
    const editorMapID = "MAP_EDITOR";
    const mapEditorSubscriberID = "MAP_EDITOR";
    const availableButtonSlots = ["BUTTON_0", "BUTTON_1", "BUTTON_2", "BUTTON_3", "BUTTON_4", "BUTTON_5", "BUTTON_6", "BUTTON_7", "BUTTON_8"];

    const displayPageElements = (pageElements) => {
        for(const buttonID of availableButtonSlots) {
            uiManager.buttons.get(buttonID).events.unsubscribe(UIElement.EVENT_CLICKED, mapEditorSubscriberID);
            uiManager.buttons.get(buttonID).events.unsubscribe(UIElement.EVENT_DRAW, mapEditorSubscriberID);
        }

        for(let i = 0; i < pageElements.length; i++) {
            const element = pageElements[i];
            const buttonID = availableButtonSlots[i];

            if(!element) {
                continue;
            }

            const [tileSetID, frameID, brushMode] = element;
            const tileSet = spriteManager.tileSprites[tileSetID];

            uiManager.buttons.get(buttonID).events.subscribe(UIElement.EVENT_DRAW, mapEditorSubscriberID, (context, localX, localY) => {
                const realTime = timer.getRealTime();
                const buffer = tileSet.getAnimationFrame(frameID, realTime)[0];
                context.drawImage(buffer.bitmap, localX, localY, 50, 50);
            });

            uiManager.buttons.get(buttonID).events.subscribe(UIElement.EVENT_CLICKED, mapEditorSubscriberID, () => {
                editor.selectBrush(element);
            });
        }
    }

    musicPlayer.loadTrack("surfing");
    
    musicPlayer.loadTrack("e2m3");

    musicPlayer.loadTrack("e2m1");

    editor.loadTileSets(spriteManager.tileSprites);

    uiManager.parseUI("MAP_EDITOR", gameContext);

    editor.refreshPageElements();

    displayPageElements(editor.getPageElements(availableButtonSlots));

    uiManager.addFetch("TEXT_TILESET_MODE", element => element.setText(`MODE: ${editor.getBrushModeID()}`));

    uiManager.addFetch("TEXT_TILESET", element => element.setText(`${editor.getCurrentSetID()}`));

    uiManager.addFetch("TEXT_PAGE_NEXT", element => element.setText(`PAGE: ${editor.pageIndex} / ${Math.floor(editor.pageElements.length / availableButtonSlots.length - 0.1)}`));

    uiManager.addClick("BUTTON_TILESET_MODE", () => {
        editor.scrollBrushMode(1);
        editor.refreshPageElements();
        displayPageElements(editor.getPageElements(availableButtonSlots));
    });

    uiManager.addClick("BUTTON_TILESET_LEFT", () => {
        editor.scrollCurrentSet(-1);
        editor.refreshPageElements();
        displayPageElements(editor.getPageElements(availableButtonSlots));
    });

    uiManager.addClick("BUTTON_TILESET_RIGHT", () => {
        editor.scrollCurrentSet(1);
        editor.refreshPageElements();
        displayPageElements(editor.getPageElements(availableButtonSlots));
    });

    uiManager.addClick("BUTTON_PAGE_NEXT", () => {
        editor.scrollPage(availableButtonSlots);
        displayPageElements(editor.getPageElements(availableButtonSlots));
    });  

    uiManager.addClick("BUTTON_L1", () => {
        musicPlayer.swapTrack("surfing", 0.2);
    });

    uiManager.addClick("BUTTON_L2", () => {
        musicPlayer.swapTrack("e2m3", 0.2);
    });

    uiManager.addClick("BUTTON_L3", () => {
        musicPlayer.swapTrack("e2m1", 0.2);
    });

    uiManager.addClick("BUTTON_LC", () => {
        
    });

    uiManager.addClick("BUTTON_SAVE", () => {
        const saveData = editor.saveMap(mapLoader.getCachedMap(editorMapID));
        saveTemplateAsFile(editorMapID + ".json", saveData);
    });

    uiManager.addClick("BUTTON_CREATE", () => {
        const gameMap = mapLoader.createEmptyMap(editorMapID, 10, 10);
        mapLoader.cacheMap(gameMap);
    });

    uiManager.addClick("BUTTON_LOAD", async () => {
        const loadSuccess = await gameContext.loadMap(editorMapID);

        if(!loadSuccess){
            return;
        }
    });

    uiManager.addClick("BUTTON_RESIZE", () => {
        const gameMap = mapLoader.getCachedMap(editorMapID);

        if(!gameMap) {
            return;
        }

        const newWidth = parseInt(prompt("MAP_WIDTH"));
        const newHeight = parseInt(prompt("MAP_HEIGHT"));

        gameMap.resize(newWidth, newHeight);

        console.log(gameMap);
    }); 
}

MapEditorState.prototype.exit = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { mapLoader } = gameContext;

    mapLoader.unparseUI("MAP_EDITOR", gameContext);
}

