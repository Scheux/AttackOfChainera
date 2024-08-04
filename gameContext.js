import { Camera } from "./source/camera/camera.js";
import { Client } from "./source/client.js";
import { Cursor } from "./source/client/cursor.js";
import { Keyboard } from "./source/client/keyboard.js";
import { EntityManager } from "./source/entity/entityManager.js";
import { EventEmitter } from "./source/events/eventEmitter.js";
import { SpriteManager } from "./source/graphics/spriteManager.js";
import { UIManager } from "./source/ui/uiManager.js";
import { getViewportTile } from "./source/helpers.js";
import { MapLoader } from "./source/map/mapLoader.js";
import { StateMachine } from "./source/state/stateMachine.js";
import { TileManager } from "./source/tile/tileManager.js";
import { Timer } from "./source/timer.js";
import { MainMenuState } from "./states/gameContext/mainMenu.js";
import { MapEditorState } from "./states/gameContext/mapEditor.js";
import { ActionQueue } from "./source/action/actionQueue.js";

export const GameContext = function() {
    this.client = new Client();
    this.renderer = new Camera(window.innerWidth, window.innerHeight);
    this.timer = new Timer(60);
    this.mapLoader = new MapLoader();
    this.entityManager = new EntityManager();
    this.tileManager = new TileManager();
    this.spriteManager = new SpriteManager();
    this.uiManager = new UIManager();
    this.actionQueue = new ActionQueue();
    this.states = new StateMachine(this);
    this.events = new EventEmitter();

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
        this.uiManager.handleCollision(cursor.position.x, cursor.position.y, cursor.radius, true);
        const tilePosition = getViewportTile(cursor.position, this.renderer.viewportX, this.renderer.viewportY);
        const tile = this.tileManager.getTile(tilePosition.x, tilePosition.y);
    });

    this.states.addState(GameContext.STATE_MAIN_MENU, new MainMenuState());
    this.states.addState(GameContext.STATE_MAP_EDITOR, new MapEditorState());
}

GameContext.STATE_MAIN_MENU = 0;
GameContext.STATE_MAP_EDITOR = 1;

GameContext.prototype.loadResources = function(resources) {
    this.uiManager.loadFontTypes(null);
    this.uiManager.loadIconTypes(null);
    this.uiManager.loadUserInterfaceTypes(resources.uiConfig);
    this.client.musicPlayer.loadMusicTypes(resources.music);
    this.entityManager.loadEntityTypes(resources.entities);
    this.tileManager.loadTileTypes(resources.tileTypes);
    this.mapLoader.loadMapTypes(resources.maps);
    this.spriteManager.loadTileSprites(resources.tiles);
    this.spriteManager.loadSpriteTypes(resources.sprites);
}

GameContext.prototype.loadMap = async function(mapID) {
    await this.mapLoader.loadMap(mapID);
    const gameMap = this.mapLoader.getLoadedMap(mapID);
    const activeMapID = this.mapLoader.getActiveMapID();

    if(!gameMap) {
        console.warn(`Error loading map! Returning...`);
        return false;
    }

    if(activeMapID) {

        if(activeMapID === mapID) {
            console.warn(`Map ${mapID} is already loaded and active! Returning...`);
            return false;
        }

        this.unloadMap(activeMapID); //TODO: ADD dynamic loading system.
    }

    this.mapLoader.setActiveMap(mapID);
    this.tileManager.workStart(gameMap.tiles);
    this.spriteManager.workStart();
    this.entityManager.workStart(gameMap.entities);
    this.renderer.loadViewport(gameMap.width, gameMap.height);
    this.client.musicPlayer.loadTrack(gameMap.music);
    this.tileManager.loadTiles(gameMap.width, gameMap.height);
    this.actionQueue.workStart();

    return true;
}

GameContext.prototype.unloadMap = function(mapID) {
    this.mapLoader.unloadMap(mapID);
    this.tileManager.workEnd();
    this.spriteManager.workEnd();
    this.entityManager.workEnd();

    //TODO find what map was unloaded and check where the sprites were from.
    //unload only the sprites that were in the now unloaded map!
}

GameContext.prototype.saveGame = function() {

}

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
