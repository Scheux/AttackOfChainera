import { Camera } from "../../source/camera/camera.js";
import { Canvas } from "../../source/camera/canvas.js";
import { Cursor } from "../../source/client/cursor.js";
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
    const { mapLoader, client, uiManager, spriteManager, renderer, timer, tileManager } = gameContext;
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

            const [tileSetID, frameID, brushModeID, brushModeType] = element;
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

    const placeTile = () => {
        const cursorTile = gameContext.getViewportTile();
        const gameMap = mapLoader.getCachedMap(editorMapID);

        if(!cursorTile || !gameMap) {
            return;
        }

        const [tileSetID, frameID, brushModeID, brushModeType] = editor.selectedBrush;

        gameMap.placeTile([tileSetID, frameID], "bottom", cursorTile.position.x, cursorTile.position.y);
    }

    renderer.events.subscribe(Camera.EVENT_MAP_RENDER_COMPLETE, mapEditorSubscriberID, (renderer) => {
        const cursorTile = gameContext.getViewportTile();

        if(!cursorTile || !editor.selectedBrush) {
            return;
        }

        const renderX = cursorTile.position.x * Camera.TILE_WIDTH * Camera.SCALE - renderer.viewportX * Camera.SCALE;
        const renderY = cursorTile.position.y * Camera.TILE_HEIGHT * Camera.SCALE - renderer.viewportY * Camera.SCALE;
        const [tileSetID, frameID, brushModeID, brushModeType] = editor.selectedBrush;
        const tileSet = spriteManager.tileSprites[tileSetID];
        const realTime = timer.getRealTime();
        const buffer = tileSet.getAnimationFrame(frameID, realTime)[0];

        renderer.display.context.globalAlpha = 0.7;
        renderer.display.context.drawImage(buffer.bitmap, renderX, renderY, Camera.TILE_WIDTH * Camera.SCALE, Camera.TILE_HEIGHT * Camera.SCALE);
        renderer.display.context.globalAlpha = 1;
    });

    cursor.events.subscribe(Cursor.RIGHT_MOUSE_DRAG, mapEditorSubscriberID, () => {
        placeTile();
    });

    cursor.events.subscribe(Cursor.RIGHT_MOUSE_CLICK, mapEditorSubscriberID, () => {
        placeTile();
    });

    musicPlayer.loadTrack("surfing");
    
    musicPlayer.loadTrack("e2m3");

    musicPlayer.loadTrack("e2m1");

    editor.loadTileSets(spriteManager.tileSprites);

    uiManager.parseUI("MAP_EDITOR", gameContext);

    editor.reloadPageElements();

    displayPageElements(editor.getPageElements(availableButtonSlots));

    uiManager.addFetch("TEXT_TILESET_MODE", element => element.setText(`MODE: ${editor.getBrushModeID()}`));

    uiManager.addFetch("TEXT_TILESET", element => element.setText(`${editor.getCurrentSetID()}`));

    uiManager.addFetch("TEXT_PAGE_NEXT", element => element.setText(`PAGE: ${editor.pageIndex} / ${Math.floor(editor.pageElements.length / availableButtonSlots.length - 0.1)}`));

    uiManager.addClick("BUTTON_TILESET_MODE", () => {
        editor.scrollBrushMode(1);
        editor.reloadPageElements();
        displayPageElements(editor.getPageElements(availableButtonSlots));
    });

    uiManager.addClick("BUTTON_TILESET_LEFT", () => {
        editor.scrollCurrentSet(-1);
        editor.reloadPageElements();
        displayPageElements(editor.getPageElements(availableButtonSlots));
    });

    uiManager.addClick("BUTTON_TILESET_RIGHT", () => {
        editor.scrollCurrentSet(1);
        editor.reloadPageElements();
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
            console.warn(`GameMap cannot be undefined! Returning...`);
            return;
        }

        const newWidth = parseInt(prompt("MAP_WIDTH"));
        const newHeight = parseInt(prompt("MAP_HEIGHT"));

        if(newWidth < 0 || newHeight < 0) {
            console.warn(`Width or Height cannot be below 0! Returning...`);
            return;
        }
    
        if(newWidth > 200 || newHeight > 200) {
            console.warn(`Width or Height cannot exceed 200! Returning...`);
            return;
        }

        gameMap.resize(newWidth, newHeight);
        tileManager.loadTiles(newWidth, newHeight);
    }); 
}

MapEditorState.prototype.exit = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { mapLoader } = gameContext;

    mapLoader.unparseUI("MAP_EDITOR", gameContext);
}

//TODO: ADD SIZE SELECTION FOR EDITOR
//TODO: CLEANUP TILES