import { Camera } from "../../source/camera/camera.js";
import { Cursor } from "../../source/client/cursor.js";
import { saveTemplateAsFile } from "../../source/helpers.js";
import { MapEditor } from "../../source/map/mapEditor.js";
import { State } from "../../source/state/state.js";
import { UIElement } from "../../source/ui/uiElement.js";

//TODO: ADD GIVING AN ID
//TODO: ADD SETTING MUSIC
//TODO: ADD LOADING MAPS - CRUCIAL!

const MAP_EDITOR_ID = "MAP_EDITOR";

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
    const availableButtonSlots = ["BUTTON_0", "BUTTON_1", "BUTTON_2", "BUTTON_3", "BUTTON_4", "BUTTON_5", "BUTTON_6", "BUTTON_7", "BUTTON_8"];
    const layerButtons = { 
        "L1": { "id": "L1", "state": 1, "text": "TEXT_L1", "layer": "bottom" },
        "L2": { "id": "L2", "state": 1, "text": "TEXT_L2", "layer": "floor" },
        "L3": { "id": "L3", "state": 1, "text": "TEXT_L3", "layer": "top" },
        "LC": { "id": "LC", "state": 1, "text": "TEXT_LC", "layer": "collision" }
    }

    let currentLayer = null;
    let currentLayerButtonID = null;

    const scollLayerButton = button => {
        const stateColors = ["#cf3723", "#eeeeee", "#fcfc3f"];

        button.state ++;

        if(button.state === 2) {
            if(layerButtons[currentLayerButtonID]) {
                const currentButton = layerButtons[currentLayerButtonID];
                currentButton.state = 1;
                uiManager.texts.get(currentButton.text).fillStyle = stateColors[currentButton.state];
            }

            if(currentLayerButtonID !== button.id) {
                currentLayer = button.layer;
                currentLayerButtonID = button.id;
            } else {
                currentLayer = null;
                currentLayerButtonID = null;
            }
        } else {
            if(button.id === currentLayerButtonID) {
                currentLayerButtonID = null;
                currentLayer = null;
            }
        }

        if(button.state > 2) {
            button.state = 0;
        }

        uiManager.texts.get(button.text).fillStyle = stateColors[button.state];
    }

    const loadPageElementsEvents = (pageElements) => {
        for(const buttonID of availableButtonSlots) {
            uiManager.buttons.get(buttonID).events.unsubscribe(UIElement.EVENT_CLICKED, MAP_EDITOR_ID);
            uiManager.buttons.get(buttonID).events.unsubscribe(UIElement.EVENT_DRAW, MAP_EDITOR_ID);
        }

        for(let i = 0; i < pageElements.length; i++) {
            const element = pageElements[i];
            const buttonID = availableButtonSlots[i];

            if(!element) {
                continue;
            }

            const [tileSetID, frameID, brushModeID] = element;
            const tileSet = spriteManager.tileSprites[tileSetID];

            uiManager.buttons.get(buttonID).events.subscribe(UIElement.EVENT_DRAW, MAP_EDITOR_ID, (context, localX, localY) => {
                const realTime = timer.getRealTime();
                const buffer = tileSet.getAnimationFrame(frameID, realTime)[0];
                context.drawImage(buffer.bitmap, localX, localY, 50, 50);
            });

            uiManager.buttons.get(buttonID).events.subscribe(UIElement.EVENT_CLICKED, MAP_EDITOR_ID, () => {
                editor.setSelectedBrush(element);
            });
        }
    }

    const placeTile = () => {
        const cursorTile = gameContext.getViewportTile();
        const gameMap = mapLoader.getCachedMap(editorMapID);
        const brush = editor.getSelectedBrush();

        if(!cursorTile || !gameMap || brush === undefined) {
            return;
        }

        if(brush === null) {
            gameMap.placeTile(null, currentLayer, cursorTile.position.x, cursorTile.position.y);
            return;
        }

        const [tileSetID, frameID, brushModeID] = brush;
        const tileSet = spriteManager.tileSprites[tileSetID];

        if(brushModeID === MapEditor.MODE_TYPE_PATTERN) {
            const pattern = tileSet.patterns[frameID];

            for(let i = 0; i < pattern.length; i++) {
                for(let j = 0; j < pattern[i].length; j++) {
                    const patternFrameID = pattern[i][j];
                    gameMap.placeTile([tileSetID, patternFrameID], currentLayer, cursorTile.position.x + j, cursorTile.position.y + i);
                }
            }

            return;
        }

        gameMap.placeTile([tileSetID, frameID], currentLayer, cursorTile.position.x, cursorTile.position.y);
    }

    renderer.events.subscribe(Camera.EVENT_MAP_RENDER_COMPLETE, MAP_EDITOR_ID, (renderer) => {
        const cursorTile = gameContext.getViewportTile();
        const brush = editor.getSelectedBrush();

        renderer.draw2DMapOutlines(gameContext);

        if(!cursorTile || brush === undefined) {
            return;
        }

        const renderX = cursorTile.position.x * Camera.TILE_WIDTH * Camera.SCALE - renderer.viewportX * Camera.SCALE;
        const renderY = cursorTile.position.y * Camera.TILE_HEIGHT * Camera.SCALE - renderer.viewportY * Camera.SCALE;

        if(brush === null) {
            renderer.display.context.fillStyle = "#701867";
            renderer.display.context.globalAlpha = 0.7;
            renderer.display.context.fillRect(renderX, renderY, Camera.TILE_WIDTH * Camera.SCALE, Camera.TILE_HEIGHT * Camera.SCALE);
            renderer.display.context.globalAlpha = 1;
            return;
        }

        const [tileSetID, frameID, brushModeID] = brush;
        const tileSet = spriteManager.tileSprites[tileSetID];
        const realTime = timer.getRealTime();
        const buffer = tileSet.getAnimationFrame(frameID, realTime)[0];

        if(brushModeID === MapEditor.MODE_TYPE_PATTERN) {
            renderer.display.context.globalAlpha = 0.7;
            const pattern = tileSet.patterns[frameID];

            for(let i = 0; i < pattern.length; i++) {
                const drawY = renderY + i * Camera.TILE_HEIGHT * Camera.SCALE;
                for(let j = 0; j < pattern[i].length; j++) {
                    const drawX = renderX + j * Camera.TILE_WIDTH * Camera.SCALE;
                    const patternFrameID = pattern[i][j];
                    const patternFrameBuffer = tileSet.getAnimationFrame(patternFrameID, realTime)[0];

                    renderer.display.context.drawImage(patternFrameBuffer.bitmap, drawX, drawY, Camera.TILE_WIDTH * Camera.SCALE, Camera.TILE_HEIGHT * Camera.SCALE);
                }
            }

            renderer.display.context.globalAlpha = 1;
            return;
        }

        renderer.display.context.globalAlpha = 0.7;
        renderer.display.context.drawImage(buffer.bitmap, renderX, renderY, Camera.TILE_WIDTH * Camera.SCALE, Camera.TILE_HEIGHT * Camera.SCALE);
        renderer.display.context.globalAlpha = 1;
    });

    cursor.events.subscribe(Cursor.RIGHT_MOUSE_DRAG, MAP_EDITOR_ID, () => {
        placeTile();
    });

    cursor.events.subscribe(Cursor.RIGHT_MOUSE_CLICK, MAP_EDITOR_ID, () => {
        placeTile();
    });

    musicPlayer.loadTrack("surfing");
    
    musicPlayer.loadTrack("e2m3");

    musicPlayer.loadTrack("e2m1");

    editor.loadTileSets(spriteManager.tileSprites);

    uiManager.parseUI("MAP_EDITOR", gameContext);

    editor.reloadPageElements();

    loadPageElementsEvents(editor.getPageElements(availableButtonSlots));

    uiManager.addFetch("TEXT_TILESET_MODE", element => element.setText(`MODE: ${editor.getBrushModeID()}`));

    uiManager.addFetch("TEXT_TILESET", element => element.setText(`${editor.getCurrentSetID()}`));

    uiManager.addFetch("TEXT_PAGE_NEXT", element => element.setText(`PAGE: ${editor.pageIndex} / ${Math.floor(editor.pageElements.length / availableButtonSlots.length - 0.1)}`));

    uiManager.addClick("BUTTON_TILESET_MODE", () => {
        editor.scrollBrushMode(1);
        editor.reloadPageElements();
        loadPageElementsEvents(editor.getPageElements(availableButtonSlots));
    });

    uiManager.addClick("BUTTON_TILESET_LEFT", () => {
        editor.scrollCurrentSet(-1);
        editor.reloadPageElements();
        loadPageElementsEvents(editor.getPageElements(availableButtonSlots));
    });

    uiManager.addClick("BUTTON_TILESET_RIGHT", () => {
        editor.scrollCurrentSet(1);
        editor.reloadPageElements();
        loadPageElementsEvents(editor.getPageElements(availableButtonSlots));
    });

    uiManager.addClick("BUTTON_PAGE_NEXT", () => {
        editor.scrollPage(availableButtonSlots);
        loadPageElementsEvents(editor.getPageElements(availableButtonSlots));
    });  

    uiManager.addClick("BUTTON_L1", () => {
        scollLayerButton(layerButtons["L1"]);
    });

    uiManager.addClick("BUTTON_L2", () => {
        scollLayerButton(layerButtons["L2"]);
    });

    uiManager.addClick("BUTTON_L3", () => {
        scollLayerButton(layerButtons["L3"]);
    });

    uiManager.addClick("BUTTON_LC", () => {
        scollLayerButton(layerButtons["LC"]);
    });

    uiManager.addClick("BUTTON_SAVE", () => {
        const saveData = mapLoader.saveMap(editorMapID);
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

    uiManager.addClick("BUTTON_VIEW_ALL", () => {
        for(const key in layerButtons) {
            const button = layerButtons[key];

            button.state = 1;

            const stateColors = ["#cf3723", "#eeeeee", "#fcfc3f"];
            const stateColor = stateColors[button.state];
            const text = uiManager.texts.get(button.text);

            text.fillStyle = stateColor;
        }

        currentLayer = null;
        currentLayerButtonID = null;
    });
}

MapEditorState.prototype.exit = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { mapLoader, client, renderer } = gameContext;
    const { cursor } = client;

    mapLoader.unparseUI("MAP_EDITOR", gameContext);
    renderer.events.unsubscribe(Camera.EVENT_MAP_RENDER_COMPLETE, MAP_EDITOR_ID);
    cursor.events.unsubscribe(Cursor.RIGHT_MOUSE_DRAG, MAP_EDITOR_ID);
    cursor.events.unsubscribe(Cursor.RIGHT_MOUSE_CLICK, MAP_EDITOR_ID);
}