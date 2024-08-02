import { Camera } from "./source/camera/camera.js";
import { Client } from "./source/client.js";
import { Cursor } from "./source/client/cursor.js";
import { Keyboard } from "./source/client/keyboard.js";
import { EntityManager } from "./source/entity/entityManager.js";
import { EventEmitter } from "./source/events/eventEmitter.js";
import { SpriteManager } from "./source/graphics/spriteManager.js";
import { getViewportTile } from "./source/helpers.js";
import { MapLoader } from "./source/map/mapLoader.js";
import { Vec2 } from "./source/math/vec2.js";
import { StateMachine } from "./source/state/stateMachine.js";
import { TileManager } from "./source/tile/tileManager.js";
import { Timer } from "./source/timer.js";

export const GameContext = function() {
    this.client = new Client();
    this.renderer = new Camera(window.innerWidth, window.innerHeight);
    this.timer = new Timer(60);
    this.mapLoader = new MapLoader();
    this.entityManager = new EntityManager();
    this.tileManager = new TileManager();
    this.spriteManager = new SpriteManager();
    this.states = new StateMachine(this);
    this.events = new EventEmitter();

    this.timer.inputFunction = () => {
        this.client.update(this);
    }

    this.timer.updateFunction = () => {
        this.entityManager.update(this);
    }

    this.timer.renderFunction = () => {
        this.renderer.update(this);
    }
}

GameContext.prototype.loadResources = function(resources) {
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
    
    if(!gameMap) {
        console.warn(`Error loading map! Returning...`);
        return;
    }

    this.mapLoader.setActiveMap(mapID);

    this.tileManager.workStart(gameMap.tiles);
    this.spriteManager.workStart();
    this.entityManager.workStart(gameMap.entities);

    this.renderer.loadViewport(gameMap.width, gameMap.height);
    this.client.musicPlayer.loadTrack(gameMap.music);
    this.tileManager.loadTiles(gameMap.width, gameMap.height);

    this.client.cursor.events.subscribe(Cursor.LEFT_MOUSE_DRAG, 0, (deltaX, deltaY) => this.renderer.dragViewportBy(deltaX, deltaY));

    this.client.cursor.events.subscribe(Cursor.LEFT_MOUSE_CLICK, 0, (event, cursor) => {
        const tilePosition = getViewportTile(cursor.position, this.renderer.viewportX, this.renderer.viewportY);
        const tile = this.tileManager.getTile(tilePosition.x, tilePosition.y);
        console.log("TILE CLICKED!", tile);
    });

    this.renderer.display.canvas.addEventListener("click", async () => {
        const map = this.mapLoader.getActiveMap();

        if(map) {
            this.client.musicPlayer.playTrack(map.music, 0.2);
        }

        /*if(!this.client.cursor.isLocked) {
            await this.renderer.display.canvas.requestPointerLock();
        }*/
    });

    document.addEventListener("pointerlockchange", () => {
        if (document.pointerLockElement === this.renderer.display.canvas) {
            this.client.cursor.isLocked = true;
            return;
        }
      
        this.client.cursor.isLocked = false;
    });

    this.spriteManager.createSprite("enemy", true);
    const enemyTwo = this.spriteManager.createSprite("enemy_two", true);
    enemyTwo.setPosition(new Vec2(100, 100));
}

GameContext.prototype.unloadMap = function(mapID) {
    this.mapLoader.unloadMap(mapID);
    this.tileManager.workEnd();
    this.spriteManager.workEnd();
    this.entityManager.workEnd();

    //todo find what map was unloaded and check where the sprites were from.
    //unload only the sprites that were in the now unloaded map!
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
