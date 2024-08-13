import { Camera } from "../../source/camera/camera.js";
import { Cursor } from "../../source/client/cursor.js";
import { getViewportTile, saveTemplateAsFile } from "../../source/helpers.js";
import { MapEditor } from "../../source/map/mapEditor.js";
import { State } from "../../source/state/state.js";
import { UIElement } from "../../source/ui/uiElement.js";

var EDITOR_MAP_ID = null;
const MAP_ID = `${Date.now()}`;
const MAX_MAP_WIDTH = 200;
const MAX_MAP_HEIGHT = 200;
const MAP_EDITOR_ID = "MAP_EDITOR";
const STATE_COLORS = ["#cf3723", "#eeeeee", "#fcfc3f"];
const AVAILABLE_BUTTON_SLOTS = ["BUTTON_0", "BUTTON_1", "BUTTON_2", "BUTTON_3", "BUTTON_4", "BUTTON_5", "BUTTON_6", "BUTTON_7", "BUTTON_8"];
const LAYER_BUTTONS = { 
    "L1": { "id": "L1", "state": 1, "text": "TEXT_L1", "layer": "bottom" },
    "L2": { "id": "L2", "state": 1, "text": "TEXT_L2", "layer": "floor" },
    "L3": { "id": "L3", "state": 1, "text": "TEXT_L3", "layer": "top" },
    "LC": { "id": "LC", "state": 1, "text": "TEXT_LC", "layer": "collision" }
}

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

    uiManager.unparseUI("FPS_COUNTER", gameContext);
    uiManager.parseUI("MAP_EDITOR", gameContext);

    let currentLayer = null;
    let currentLayerButtonID = null;

    const setLayerOpacity = () => {
        const editorMap = mapLoader.getCachedMap(EDITOR_MAP_ID);

        if(!editorMap) {
            return;
        }

        for(const key in LAYER_BUTTONS) {
            const layerButton = LAYER_BUTTONS[key];

            switch(layerButton.state) {
                case 0: {
                    editorMap.layerOpacity[layerButton.layer] = 0;
                    break;
                }

                case 1: {
                    editorMap.layerOpacity[layerButton.layer] = 1;
                    break;
                }

                case 2: {
                    editorMap.layerOpacity[layerButton.layer] = 1;
                    break;
                }
            }
        }

        if(currentLayerButtonID !== null) {
            for(const key in LAYER_BUTTONS) {
                const layerButton = LAYER_BUTTONS[key];

                if(layerButton.state === 1) {
                    editorMap.layerOpacity[layerButton.layer] = 0.5;
                }
            }
        }
    }

    const scollLayerButton = button => {
        button.state ++;

        if(button.state > 2) {
            button.state = 0;
        }

        switch(button.state) {
            case 2: {
                if(LAYER_BUTTONS[currentLayerButtonID]) {
                    const currentButton = LAYER_BUTTONS[currentLayerButtonID];
                    currentButton.state = 1;
                    uiManager.texts.get(currentButton.text).fillStyle = STATE_COLORS[currentButton.state];
                    currentLayer = null;
                    currentLayerButtonID = null;
                }
    
                currentLayer = button.layer;
                currentLayerButtonID = button.id;

                break;
            }

            default: {
                if(button.id === currentLayerButtonID) {
                    currentLayerButtonID = null;
                    currentLayer = null;
                }

                break;
            }
        }

        setLayerOpacity();
       
        uiManager.texts.get(button.text).fillStyle = STATE_COLORS[button.state];
    }

    const loadPageElementsEvents = (pageElements) => {
        for(const buttonID of AVAILABLE_BUTTON_SLOTS) {
            uiManager.buttons.get(buttonID).events.unsubscribe(UIElement.EVENT_CLICKED, MAP_EDITOR_ID);
            uiManager.buttons.get(buttonID).events.unsubscribe(UIElement.EVENT_DRAW, MAP_EDITOR_ID);
        }

        for(let i = 0; i < pageElements.length; i++) {
            const element = pageElements[i];
            const buttonID = AVAILABLE_BUTTON_SLOTS[i];

            if(!element === undefined) {
                continue;
            }

            if(element === null) {
                uiManager.buttons.get(buttonID).events.subscribe(UIElement.EVENT_DRAW, MAP_EDITOR_ID, (context, localX, localY) => {
                    context.fillStyle = "#701867";
                    context.fillRect(localX, localY, 25, 25);
                    context.fillRect(localX + 25, localY + 25, 25, 25);
                    context.fillStyle = "#000000";
                    context.fillRect(localX + 25, localY, 25, 25);
                    context.fillRect(localX, localY + 25, 25, 25);
                });
                continue;
            }

            const [tileSetID, frameID, brushModeID] = element;
            const tileSet = spriteManager.tileSprites[tileSetID];

            uiManager.buttons.get(buttonID).events.subscribe(UIElement.EVENT_CLICKED, MAP_EDITOR_ID, () => {
                editor.setSelectedBrush(element);
            });

            uiManager.buttons.get(buttonID).events.subscribe(UIElement.EVENT_DRAW, MAP_EDITOR_ID, (context, localX, localY) => {
                if(brushModeID === MapEditor.MODE_TYPE_PATTERN) {
                    context.fillText(frameID, localX, localY + 25);
                    
                    return;
                }

                const realTime = timer.getRealTime();
                const buffer = tileSet.getAnimationFrame(frameID, realTime)[0];
                context.drawImage(buffer.bitmap, localX, localY, 50, 50);
            });
        }
    }

    const placeTile = () => {
        const cursorTile = getViewportTile(client.cursor.position, renderer.viewportX, renderer.viewportY);
        const gameMap = mapLoader.getCachedMap(EDITOR_MAP_ID);
        const brush = editor.getSelectedBrush();

        if(!gameMap || brush === undefined) {
            return;
        }

        if(brush === null) {
            gameMap.placeTile(null, currentLayer, cursorTile.x, cursorTile.y);
            return;
        }

        const [tileSetID, frameID, brushModeID] = brush;
        const tileSet = spriteManager.tileSprites[tileSetID];

        if(brushModeID === MapEditor.MODE_TYPE_PATTERN) {
            const pattern = tileSet.patterns[frameID];

            for(let i = 0; i < pattern.length; i++) {
                for(let j = 0; j < pattern[i].length; j++) {
                    const patternFrameID = pattern[i][j];
                    gameMap.placeTile([tileSetID, patternFrameID], currentLayer, cursorTile.x + j, cursorTile.y + i);
                }
            }

            return;
        }

        gameMap.placeTile([tileSetID, frameID], currentLayer, cursorTile.x, cursorTile.y);
    }

    const incrementCollisionIndex = () => {
        const cursorTile = getViewportTile(client.cursor.position, renderer.viewportX, renderer.viewportY);
        const gameMap = mapLoader.getCachedMap(EDITOR_MAP_ID);
        const collisionTypes = gameContext.getType("collisionTypes");
        const collisionTypesKeys = Object.keys(collisionTypes);

        if(!gameMap) {
            return;
        }

        const currentIndex = gameMap.getLayerTile("collision", cursorTile.x, cursorTile.y);
        const nextIndex = currentIndex + 1;

        if(nextIndex > collisionTypesKeys.length - 1) {
            gameMap.placeTile(0, "collision", cursorTile.x, cursorTile.y);
            return;
        }

        gameMap.placeTile(nextIndex, "collision", cursorTile.x, cursorTile.y);
    }

    renderer.events.subscribe(Camera.EVENT_MAP_RENDER_COMPLETE, MAP_EDITOR_ID, (renderer) => {
        const cursorTile = getViewportTile(client.cursor.position, renderer.viewportX, renderer.viewportY);
        const brush = editor.getSelectedBrush();

        renderer.draw2DMapOutlines(gameContext);

        if(brush === undefined || currentLayerButtonID === LAYER_BUTTONS["LC"].id) {
            return;
        }

        const tileWidth = Camera.TILE_WIDTH * Camera.SCALE;
        const tileHeight = Camera.TILE_HEIGHT * Camera.SCALE;
        const halfTileWidth = tileWidth / 2;
        const halfTileHeight = tileHeight / 2;
        const renderX = cursorTile.x * tileWidth - renderer.viewportX * Camera.SCALE;
        const renderY = cursorTile.y * tileHeight - renderer.viewportY * Camera.SCALE;

        if(brush === null) {
            renderer.display.context.globalAlpha = 0.7;
            renderer.display.context.fillStyle = "#701867";
            renderer.display.context.fillRect(renderX, renderY, halfTileWidth, halfTileHeight);
            renderer.display.context.fillRect(renderX + halfTileWidth, renderY + halfTileHeight, halfTileWidth, halfTileHeight);
            renderer.display.context.fillStyle = "#000000";
            renderer.display.context.fillRect(renderX + halfTileWidth, renderY, halfTileWidth, halfTileHeight);
            renderer.display.context.fillRect(renderX, renderY + halfTileHeight, halfTileWidth, halfTileHeight);
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
                const drawY = renderY + i * tileHeight;
                for(let j = 0; j < pattern[i].length; j++) {
                    const drawX = renderX + j * tileWidth;
                    const patternFrameID = pattern[i][j];
                    const patternFrameBuffer = tileSet.getAnimationFrame(patternFrameID, realTime)[0];

                    renderer.display.context.drawImage(patternFrameBuffer.bitmap, drawX, drawY, tileWidth, tileHeight);
                }
            }

            renderer.display.context.globalAlpha = 1;
            return;
        }

        renderer.display.context.globalAlpha = 0.7;
        renderer.display.context.drawImage(buffer.bitmap, renderX, renderY, tileWidth, tileHeight);
        renderer.display.context.globalAlpha = 1;
    });

    cursor.events.subscribe(Cursor.RIGHT_MOUSE_DRAG, MAP_EDITOR_ID, () => {
        if(currentLayerButtonID !== LAYER_BUTTONS["LC"].id) {
            placeTile();
            return;
        }
    });

    cursor.events.subscribe(Cursor.RIGHT_MOUSE_CLICK, MAP_EDITOR_ID, () => {
        if(currentLayerButtonID !== LAYER_BUTTONS["LC"].id) {
            placeTile();
            return;
        }

        incrementCollisionIndex();
    });

    editor.loadTileSets(spriteManager.tileSprites);
    editor.reloadPageElements();

    loadPageElementsEvents(editor.getPageElements(AVAILABLE_BUTTON_SLOTS));

    uiManager.addFetch("TEXT_TILESET_MODE", element => element.setText(`MODE: ${editor.getBrushModeID()}`));

    uiManager.addFetch("TEXT_TILESET", element => element.setText(`${editor.getCurrentSetID()}`));

    uiManager.addFetch("TEXT_PAGE", element => {
        const maxElementsPerPage = AVAILABLE_BUTTON_SLOTS.length;
        const maxPagesNeeded = Math.ceil(editor.pageElements.length / maxElementsPerPage);
        const showMaxPagesNeeded = maxPagesNeeded === 0 ? 1 : maxPagesNeeded;

        element.setText(`${editor.pageIndex + 1} / ${showMaxPagesNeeded}`);
    });

    uiManager.addClick("BUTTON_TILESET_MODE", () => {
        editor.scrollBrushMode(1);
        editor.reloadPageElements();
        loadPageElementsEvents(editor.getPageElements(AVAILABLE_BUTTON_SLOTS));
    });

    uiManager.addClick("BUTTON_TILESET_LEFT", () => {
        editor.scrollCurrentSet(-1);
        editor.reloadPageElements();
        loadPageElementsEvents(editor.getPageElements(AVAILABLE_BUTTON_SLOTS));
    });

    uiManager.addClick("BUTTON_TILESET_RIGHT", () => {
        editor.scrollCurrentSet(1);
        editor.reloadPageElements();
        loadPageElementsEvents(editor.getPageElements(AVAILABLE_BUTTON_SLOTS));
    });

    uiManager.addClick("BUTTON_PAGE_LAST", () => {
        editor.scrollPage(AVAILABLE_BUTTON_SLOTS, -1);
        loadPageElementsEvents(editor.getPageElements(AVAILABLE_BUTTON_SLOTS));
    });  

    uiManager.addClick("BUTTON_PAGE_NEXT", () => {
        editor.scrollPage(AVAILABLE_BUTTON_SLOTS, 1);
        loadPageElementsEvents(editor.getPageElements(AVAILABLE_BUTTON_SLOTS));
    });  

    uiManager.addClick("BUTTON_L1", () => {
        scollLayerButton(LAYER_BUTTONS["L1"]);
    });

    uiManager.addClick("BUTTON_L2", () => {
        scollLayerButton(LAYER_BUTTONS["L2"]);
    });

    uiManager.addClick("BUTTON_L3", () => {
        scollLayerButton(LAYER_BUTTONS["L3"]);
    });

    uiManager.addClick("BUTTON_LC", () => {
        scollLayerButton(LAYER_BUTTONS["LC"]);
    });

    uiManager.addClick("BUTTON_SAVE", () => {
        const saveData = mapLoader.saveMap(EDITOR_MAP_ID);
        saveTemplateAsFile(EDITOR_MAP_ID + ".json", saveData);
    });

    uiManager.addClick("BUTTON_CREATE", () => {
        const gameMap = mapLoader.createEmptyMap(MAP_ID, 10, 10);
        mapLoader.cacheMap(gameMap);
    });

    uiManager.addClick("BUTTON_LOAD", async () => {
        const mapID = prompt("MAP-ID?");

        if(mapID.length === 0) {
            const loadSuccess = await gameContext.loadMap(MAP_ID);
            gameContext.parseMap(MAP_ID, true);
            EDITOR_MAP_ID = MAP_ID;
            return;
        }

        const loadSuccess = await gameContext.loadMap(mapID);
        gameContext.parseMap(mapID, true);
        EDITOR_MAP_ID = mapID;
    });

    uiManager.addClick("BUTTON_RESIZE", () => {
        const gameMap = mapLoader.getCachedMap(EDITOR_MAP_ID);

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
    
        if(newWidth > MAX_MAP_WIDTH || newHeight > MAX_MAP_HEIGHT) {
            console.warn(`Width or Height cannot exceed 200! Returning...`);
            return;
        }

        gameMap.resize(newWidth, newHeight);
        mapLoader.loadMapConnections(EDITOR_MAP_ID);
    }); 

    uiManager.addClick("BUTTON_VIEW_ALL", () => {
        for(const key in LAYER_BUTTONS) {
            const button = LAYER_BUTTONS[key];
            button.state = 1;
            uiManager.texts.get(button.text).fillStyle = STATE_COLORS[button.state];
        }

        currentLayer = null;
        currentLayerButtonID = null;

        setLayerOpacity();
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