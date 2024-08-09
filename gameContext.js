import { Camera } from "./source/camera/camera.js";
import { Client } from "./source/client.js";
import { Cursor } from "./source/client/cursor.js";
import { Keyboard } from "./source/client/keyboard.js";
import { EntityManager } from "./source/entity/entityManager.js";
import { EventEmitter } from "./source/events/eventEmitter.js";
import { SpriteManager } from "./source/graphics/spriteManager.js";
import { UIManager } from "./source/ui/uiManager.js";
import { getViewportTile, saveTemplateAsFile, tileToPosition_corner } from "./source/helpers.js";
import { MapLoader } from "./source/map/mapLoader.js";
import { StateMachine } from "./source/state/stateMachine.js";
import { TileManager } from "./source/tile/tileManager.js";
import { Timer } from "./source/timer.js";
import { MainMenuState } from "./states/gameContext/mainMenu.js";
import { MapEditorState } from "./states/gameContext/mapEditor.js";
import { ActionQueue } from "./source/action/actionQueue.js";
import { UIElement } from "./source/ui/uiElement.js";
import { PlayGameState } from "./states/gameContext/playGame.js";
import { PositionComponent } from "./components/position.js";
import { SpriteComponent } from "./components/sprite.js";
import { Entity } from "./source/entity/entity.js";

const DEFAULT_SPRITE = "idle_down";

export const GameContext = function() {
    this.config = {};
    this.client = new Client();
    this.renderer = new Camera(window.innerWidth, window.innerHeight);
    this.timer = new Timer(60);
    this.mapLoader = new MapLoader();
    this.entityManager = new EntityManager();
    this.tileManager = new TileManager();
    this.spriteManager = new SpriteManager();
    this.uiManager = new UIManager();
    this.actionQueue = new ActionQueue();
    this.events = new EventEmitter();
    this.states = new StateMachine(this);
    
    this.states.addState(GameContext.STATE_MAIN_MENU, new MainMenuState());
    this.states.addState(GameContext.STATE_MAP_EDITOR, new MapEditorState());
    this.states.addState(GameContext.STATE_PLAY_GAME, new PlayGameState());

    this.timer.inputFunction = () => {
        this.client.update(this);
    }

    this.timer.updateFunction = () => {
        this.actionQueue.update(this);
        this.entityManager.update(this);
    }

    this.timer.renderFunction = () => {
        this.uiManager.update(this);
        this.renderer.update(this);
    }

    this.client.cursor.events.subscribe(Cursor.LEFT_MOUSE_DRAG, "GAME_CONTEXT", (deltaX, deltaY) => this.renderer.dragViewportBy(deltaX, deltaY));

    this.client.cursor.events.subscribe(Cursor.LEFT_MOUSE_CLICK, "GAME_CONTEXT", (event, cursor) => {
        const collidedElements = this.uiManager.checkCollisions(cursor.position.x, cursor.position.y, cursor.radius);
        const viewportTile = this.getViewportTile();

        if(collidedElements.length === 0) {
            console.log(viewportTile);
            //TODO: CHECK CLICK ON GAMEMAP HERE.
            return;
        }   

        for(const element of collidedElements) {
            element.events.emit(UIElement.EVENT_CLICKED);
        }
    });
}

GameContext.STATE_MAIN_MENU = 0;
GameContext.STATE_MAP_EDITOR = 1;
GameContext.STATE_PLAY_GAME = 2;

GameContext.prototype.loadResources = function(resources) {
    this.config = resources.config;
    this.uiManager.loadFontTypes(null);
    this.uiManager.loadIconTypes(null);
    this.uiManager.loadUserInterfaceTypes(resources.uiConfig);
    this.client.musicPlayer.loadMusicTypes(resources.music);
    this.entityManager.loadEntityTypes(resources.entities);
    this.tileManager.loadTileTypes(resources.tileTypes);
    this.mapLoader.loadMapTypes(resources.maps);
    this.spriteManager.loadTileSprites(resources.tiles);
    this.spriteManager.loadSpriteTypes(resources.sprites);

    this.client.keyboard.subscribe(Keyboard.KEY_PRESSED, "s", () => {
        this.saveGame();
    })
}

//SCRAP! When loading a map in, always check if any of the entities of gameMap.entities has a "reset" flag
//if that flag exists, then create a new entity based on that flag
//if a map gets unloaded and an entity has the "reset" flag, that entity gets deleted. straight up. bye-bye.

GameContext.prototype.exitGame = function() {
    this.actionQueue.workEnd();
    this.entityManager.workEnd();
    this.spriteManager.workEnd();
    this.tileManager.workEnd();
    //this.uiManager.workEnd();
}

GameContext.prototype.saveGame = function() {
    const entityData = [];
    const mapCache = {};
    
    for (const key in this.mapLoader.mapCache) {
        const cacheState = this.mapLoader.mapCache[key];
        mapCache[key] = cacheState;
    }
    
    for (const [entityID, entity] of this.entityManager.entities) {
        const positionComponent = entity.components.getComponent(PositionComponent);
        const spriteComponent = entity.components.getComponent(SpriteComponent);

        entityData.push({
            type: entity.config.id,
            map: positionComponent.mapID,
            tileX: positionComponent.tileX,
            tileY: positionComponent.tileY,
            spriteType: spriteComponent.spriteType
        });
    }
    
    const formattedEntityData = entityData.map(data => 
        `{ "type": "${data.type}", "map": "${data.map}", "tileX": ${data.tileX}, "tileY": ${data.tileY}, "spriteType": "${data.spriteType}" }`
    ).join(',\n        ');
    
    const formattedMapCache = Object.entries(mapCache)
        .map(([key, value]) => `"${key}": ${value}`)
        .join(', ');
    
    const jsonString = 
`{
    "entityData": [
        ${formattedEntityData}
    ],
    "mapCache": { ${formattedMapCache} },
    "mapID": "${this.mapLoader.getActiveMapID()}",
    "playerData": null
}`;
    
    saveTemplateAsFile("save.json", jsonString);
}

GameContext.prototype.loadGame = async function(gameData) {
    const { entityData, mapID, mapCache, playerData } = gameData;
    
    for(const entity of entityData) {
        const { type, map, tileX, tileY, spriteType } = entity;

        if(!mapCache[map]) {
            console.warn(`Error loading entity! Entity is on map (${map}) that was never cached! Continuing...`);
            continue;
        }

        this.createEntity(map, type, tileX, tileY, spriteType);

        //Store playerData not on the player entity but in the client!
    }

    this.mapLoader.mapCache = mapCache;
    await this.loadMap(mapID);
}

GameContext.prototype.newGame = function() {
    //1. Creates a new game with all the cutscenes, ect.
    //2. FUN
}

/**
 * Loads a map with all its neighbors and entities.
 * 
 * @param {string} mapID The ID of the map to be loaded.
 * @returns {boolean} If the loading process was successful.
 */
GameContext.prototype.loadMap = async function(mapID, ignoreEntities) {
    await this.mapLoader.loadMap(mapID);
    const gameMap = this.mapLoader.getLoadedMap(mapID);
    const oldActiveMapID = this.mapLoader.getActiveMapID();

    if(!gameMap) {
        console.warn(`Error loading map! Returning...`);
        return false;
    }

    if(oldActiveMapID) {
        if(oldActiveMapID === mapID) {
            console.warn(`Map ${mapID} is already loaded and active! Returning...`);
            return false;
        }
        
        this.unloadProcess(mapID);
    }

    this.mapLoader.setActiveMap(mapID);
    this.client.musicPlayer.loadTrack(gameMap.music);
    this.actionQueue.workStart();

    if(ignoreEntities) {
        return;
    }

    if(!this.mapLoader.mapCache[mapID]) {
        for(const entityConfig of gameMap.entities) {
            this.createEntity(mapID, entityConfig.type, entityConfig.tileX, entityConfig.tileY, DEFAULT_SPRITE);
        }

        this.mapLoader.mapCache[mapID] = 1;
    }

    for(const connection of gameMap.connections) {
        if(!this.mapLoader.mapCache[connection.id]) {
            const connectedMap = this.mapLoader.getLoadedMap(connection.id);

            for(const entityConfig of connectedMap.entities) {
                this.createEntity(connection.id, entityConfig.type, entityConfig.tileX, entityConfig.tileY, DEFAULT_SPRITE);
            }

            this.mapLoader.mapCache[connection.id] = 1;
        }
    }

    for(const [entityID, entity] of this.entityManager.entities) {
        const positionComponent = entity.components.getComponent(PositionComponent);

        if(positionComponent.mapID === mapID) {
            this.enableEntity(entityID);
            this.updateEntityPositionEvent(entityID, 0, 0);
            continue;
        }

        for(const connection of gameMap.connections) {
            if(connection.id === positionComponent.mapID) {
                const offsetX = Camera.TILE_WIDTH * connection.startX;
                const offsetY = Camera.TILE_HEIGHT * connection.startY;

                this.enableEntity(entityID);
                this.updateEntityPositionEvent(entityID, offsetX, offsetY);
                break;
            }
        }
    }

    return true;
}

/**
 * Unloads every loaded map that is no longer needed.
 * Also unloads their entities.
 * 
 * @param {string} mapID The id of the new main map.
 */
GameContext.prototype.unloadProcess = function(mapID) {
    const coreMap = this.mapLoader.getLoadedMap(mapID);
    const keptMaps = new Set([mapID]);
    const removedMaps = new Set();

    for(const connection of coreMap.connections) {
        keptMaps.add(connection.id);
    }

    for(const [mapID, map] of this.mapLoader.loadedMaps) {
        if(keptMaps.has(mapID)) {
            continue;
        }

        this.mapLoader.unloadMap(mapID);
       
        removedMaps.add(mapID);
    }

    for(const [entityID, entity] of this.entityManager.entities) {
        const positionComponent = entity.components.getComponent(PositionComponent);

        if(!removedMaps.has(positionComponent.mapID)) {
            continue;
        }

        this.disableEntity(entityID);
    }
}

GameContext.prototype.removeEntity = function(mapID, entityID) {
    const gameMap = this.mapLoader.getCachedMap(mapID);

    if(!gameMap || !entityID) {
        console.warn(`Entity deletion failed! Returning...`);
        return;
    }

    const entity = this.entityManager.getEntity(entityID);

    if(!entity) {
        console.warn(`Entity deletion failed! Returning...`);
        return;
    }

    const positionComponent = entity.components.getComponent(PositionComponent);
    const spriteComponent = entity.components.getComponent(SpriteComponent);

    this.entityManager.removeEntity(entityID);
    this.spriteManager.removeSprite(spriteComponent.spriteID);
}

GameContext.prototype.createEntity = function(mapID, entityTypeID, tileX, tileY, spriteType) {
    if(!this.mapLoader.mapTypes[mapID] || tileX === undefined || spriteType === undefined || tileY === undefined || !this.entityManager.entityTypes[entityTypeID]) {
        console.warn(`Entity creation failed! Returning...`);
        return;
    }

    const entityType = this.entityManager.entityTypes[entityTypeID];
    const entity = this.entityManager.createEntity(entityTypeID);
    const entityID = entity.getID();
    const positionVector = tileToPosition_corner(tileX, tileY);

    const positionComponent = new PositionComponent();
    const spriteComponent = new SpriteComponent();

    positionComponent.positionX = positionVector.x;
    positionComponent.positionY = positionVector.y;
    positionComponent.tileX = tileX;
    positionComponent.tileY = tileY;
    positionComponent.dimX = entityType.dimX;
    positionComponent.dimY = entityType.dimY;
    positionComponent.mapID = mapID;
    spriteComponent.spriteType = spriteType;

    entity.components.addComponent(positionComponent);
    entity.components.addComponent(spriteComponent);  
    
    switch(entityType.objectType) {
        case "Player": {
            break;
        }

        default: {
            console.warn(`objectType ${entityType.objectType} is not valid!`);
            break;
        }
    }

    return entityID;
}

GameContext.prototype.updateEntityPositionEvent = function(entityID, mapOffsetX, mapOffsetY) {
    const entity = this.entityManager.getEntity(entityID);

    const positionComponent = entity.components.getComponent(PositionComponent);
    const spriteComponent = entity.components.getComponent(SpriteComponent);

    const sprite = this.spriteManager.getSprite(spriteComponent.spriteID);

    entity.events.unsubscribe(Entity.EVENT_POSITION_UPDATE, "GAME_CONTEXT");
    entity.events.subscribe(Entity.EVENT_POSITION_UPDATE, "GAME_CONTEXT", (positionX, positionY) => sprite.setPositionRaw(positionX + mapOffsetX, positionY + mapOffsetY));
    entity.events.emit(Entity.EVENT_POSITION_UPDATE, positionComponent.positionX, positionComponent.positionY);
}

GameContext.prototype.enableEntity = function(entityID) {
    const entity = this.entityManager.getEntity(entityID);

    if(!entity || this.entityManager.activeEntities.has(entityID)) {
        return;
    }

    this.entityManager.changeEntityState(entityID, true);

    const positionComponent = entity.components.getComponent(PositionComponent);
    const spriteComponent = entity.components.getComponent(SpriteComponent);

    const entityType = entity.config;
    const [spriteSetID, spriteAnimationID] = entityType.sprites[spriteComponent.spriteType];
    const sprite = this.spriteManager.createSprite(spriteSetID, true, spriteAnimationID);
    const spriteID = sprite.getID();

    spriteComponent.spriteID = spriteID;

    const gameMap = this.mapLoader.getCachedMap(positionComponent.mapID);
    gameMap.setPointers(positionComponent.tileX, positionComponent.tileY, positionComponent.dimX, positionComponent.dimY, entityID);
}

GameContext.prototype.disableEntity = function(entityID) {
    const entity = this.entityManager.getEntity(entityID);

    if(!entity || !this.entityManager.activeEntities.has(entityID)) {
        return;
    }

    const positionComponent = entity.components.getComponent(PositionComponent);
    const spriteComponent = entity.components.getComponent(SpriteComponent);

    this.entityManager.changeEntityState(entityID, false);
    this.spriteManager.removeSprite(spriteComponent.spriteID);

    spriteComponent.spriteID = null;
    entity.events.unsubscribe(Entity.EVENT_POSITION_UPDATE, "GAME_CONTEXT");

    const gameMap = this.mapLoader.getCachedMap(positionComponent.mapID);
    gameMap.removePointers(positionComponent.tileX, positionComponent.tileY, positionComponent.dimX, positionComponent.dimY, entityID);
}

GameContext.prototype.getViewportTile = function() {
    const viewportCell = getViewportTile(this.client.cursor.position, this.renderer.viewportX, this.renderer.viewportY);
    const viewportTile = this.tileManager.getTile(viewportCell.x, viewportCell.y);

    return viewportTile;
}

GameContext.prototype.getConfigElement = function(key) {
    if(!this.config[key]) {
        console.warn(`ConfigElement ${key} does not exist! Returning null...`);
        return null;
    }

    return this.config[key];
}

/*
GameContext.prototype.setupPlayer3D = function() {
    this.player = null;
    const position3D = this.player.position3D;
    const move3D = this.player.move3D;

    this.client.keyboard.subscribe(Keyboard.KEY_PRESSED, "w", (event, keyboard) => move3D.isMovingUp = true);
    this.client.keyboard.subscribe(Keyboard.KEY_PRESSED, "a", (event, keyboard) => move3D.isMovingLeft = true);
    this.client.keyboard.subscribe(Keyboard.KEY_PRESSED, "s", (event, keyboard) => move3D.isMovingDown = true);
    this.client.keyboard.subscribe(Keyboard.KEY_PRESSED, "d", (event, keyboard) => move3D.isMovingRight = true);

    this.client.keyboard.subscribe(Keyboard.KEY_RELEASED,"w",  (event, keyboard) => move3D.isMovingUp = false);
    this.client.keyboard.subscribe(Keyboard.KEY_RELEASED,"a",  (event, keyboard) => move3D.isMovingLeft = false);
    this.client.keyboard.subscribe(Keyboard.KEY_RELEASED,"s",  (event, keyboard) => move3D.isMovingDown = false);
    this.client.keyboard.subscribe(Keyboard.KEY_RELEASED,"d",  (event, keyboard) => move3D.isMovingRight = false);

    this.client.cursor.events.subscribe(Cursor.MOVE, 0, (event, cursor, deltaX, deltaY) => {
        if(!this.client.cursor.isLocked) {
            return;
        }

        position3D.rotation -= deltaX / 16;
        position3D.rotation %= 360;

        if(position3D.rotation < 0) {
            position3D.rotation += 360;
        }

        position3D.pitch -= deltaY / 20;

        if(position3D.pitch > 8) {
            position3D.pitch = 8;
        } else if (position3D.pitch < -8) {
            position3D.pitch = -8;
        }
    });
}
*/