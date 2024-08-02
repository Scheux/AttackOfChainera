import { Canvas } from "./canvas.js";
import { EventEmitter } from "../events/eventEmitter.js";
import { Raycaster } from "./raycaster.js";

export const Camera = function(screenWidth, screenHeight) {
    this.viewportX = 0;
    this.viewportY = 0;
    this.viewportWidth = screenWidth;
    this.viewportHeight = screenHeight;

    this.fps = 0;
    this.smoothedFPS = 60;
    this.smoothingFactor = 0.01;

    this.display = new Canvas().useExistingElement(screenWidth, screenHeight, "canvas");
    this.offscreenDisplay = new Canvas().createNewElement(screenWidth / 2, screenHeight / 2).getImageData();
    this.buffer = new Canvas().createNewElement(screenWidth / 2, screenHeight / 2).getImageData();

    this.events = new EventEmitter();
    this.events.listen(Camera.EVENT_LEVEL_LOAD);
    this.events.listen(Camera.EVENT_WINDOW_RESIZE);

    this.events.subscribe(Camera.EVENT_LEVEL_LOAD, 0, (width, height) => this.loadViewport(width, height));
    this.events.subscribe(Camera.EVENT_WINDOW_RESIZE, 0, (width, height) => this.resizeViewport(width, height));
    
    window.addEventListener("resize", () => this.events.emit(Camera.EVENT_WINDOW_RESIZE, window.innerWidth, window.innerHeight));

    this.raycaster = new Raycaster();
    this.raycaster.copyScreen(this.buffer);
    this.raycaster.calculateRayData();
}

Camera.SCALE = 1;
Camera.TILE_WIDTH = 64;
Camera.TILE_HEIGHT = 64;
Camera.EVENT_LEVEL_LOAD = 0;
Camera.EVENT_WINDOW_RESIZE = 1;
Camera.WALL_X_POSITIVE = -1;
Camera.WALL_X_NEGATIVE = 1;
Camera.WALL_Y_POSITIVE = -1;
Camera.WALL_Y_NEGATIVE = 1;

Camera.prototype.drawSprites = function() {}

Camera.prototype.drawTiles = function(gameContext) {
    const { timer, mapLoader, tileManager, spriteManager } = gameContext;
    const gameMap = mapLoader.getActiveMap();

    if(!gameMap) {
        return;
    }

    const offsetX = 0;
    const offsetY = 1;
    const realTime = timer.getRealTime();
    const startX = Math.floor(this.viewportX / Camera.TILE_WIDTH);
    const startY = Math.floor(this.viewportY / Camera.TILE_HEIGHT);
    const endX = Math.floor((this.viewportX + this.getViewportWidth()) / Camera.TILE_WIDTH) + offsetX;
    const endY = Math.floor((this.viewportY + this.getViewportHeight()) / Camera.TILE_HEIGHT) + offsetY;

    for(const key of gameMap.layerDrawOrder) {
        const layer = gameMap.layers[key];

        for(let i = startY; i <= endY; i++) {
            const tileRow = layer[i];

            if(!tileRow) {
                continue;
            }

            const renderY = i * Camera.TILE_HEIGHT - this.viewportY;
            
            for(let j = startX; j <= endX; j++) {
                
                if(!tileRow[j] === undefined) {
                    continue;
                }

                const renderX = j * Camera.TILE_WIDTH - this.viewportX;
                const tileGraphics = ["test_raycast", "wood"];//tileRow[j];
                const [tileSetID, tileSetAnimationID] = tileGraphics;
                const tileSet = spriteManager.tileSprites[tileSetID];
                const buffers = tileSet.getAnimationFrame(tileSetAnimationID, realTime);
                const buffer = buffers[0];

                this.display.context.drawImage(buffer.bitmap, renderX + buffer.offset.x, renderY + buffer.offset.y);
            }
        }
    }
}

Camera.prototype.calculateFPS = function(passedTime) {
    const fps = 1 / passedTime;
    const smoothedFPS = (fps - this.smoothedFPS) * this.smoothingFactor;

    this.fps = fps;
    this.smoothedFPS += smoothedFPS;
}

Camera.prototype.update = function(gameContext) {
    const { timer, spriteManager } = gameContext; 
    const deltaTime = timer.getDeltaTime();
    const realTime = timer.getRealTime();

    this.display.clear();
    this.buffer.clear();

    this.calculateFPS(deltaTime);
    //this.drawTiles(gameContext);
    const graphics = [["test_raycast", "grass"], ["test_raycast", "water"], ["test_raycast", "meadow"], ["test_raycast", "ocean"]].map(([setID, animationID]) => {
        const tileSet = spriteManager.tileSprites[setID];
        const buffers = tileSet.getAnimationFrame(animationID, realTime);
        const buffer = buffers[0];

        return buffer;
    });

    this.raycaster.copyPosition(gameContext.player.position3D);
    this.raycaster.raycast(gameContext, graphics);

    this.offscreenDisplay.context.putImageData(this.buffer.imageData, 0, 0);
    this.display.context.drawImage(this.offscreenDisplay.canvas, 0, 0, this.display.width, this.display.height);
    this.display.context.drawImage(this.buffer.canvas, 0, 0, this.display.width, this.display.height);

    this.display.context.fillStyle = "#ffffff";
    this.display.context.font = "30px Arial";
    this.display.context.fillText(`FPS: ${Math.floor(this.smoothedFPS)}`, 0, 25);

    this.display.context.fillRect(this.display.centerX - 4, this.display.centerY - 4, 8, 8);
}

Camera.prototype.limitViewport = function() {
    if(this.viewportX < 0) {
        this.viewportX = 0;
    }
  
    if(this.viewportY < 0) {
        this.viewportY = 0;
    }
  
    if(this.viewportX >= this.viewportX_limit) {
        this.viewportX = this.viewportX_limit;
    }
  
    if(this.viewportY >= this.viewportY_limit) {
        this.viewportY = this.viewportY_limit;
    }
}

Camera.prototype.dragViewportBy = function(param_dragX, param_dragY) {
    this.viewportX += Math.trunc((param_dragX / Camera.SCALE));
    this.viewportY += Math.trunc((param_dragY / Camera.SCALE));
  
    this.limitViewport();
}
  
Camera.prototype.snapViewportTo = function(param_snapX, param_snapY) {
    this.viewportX = param_snapX;
    this.viewportY = param_snapY;

    this.limitViewport();
}

Camera.prototype.loadViewport = function(mapWidth, mapHeight) {
    const width = mapWidth * Camera.TILE_WIDTH;
    const height = mapHeight * Camera.TILE_HEIGHT;

    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;

    if(width <= this.getViewportWidth()) {
        this.viewportX_limit = 0;
    } else {
        this.viewportX_limit = width - this.getViewportWidth();
    }

    if(height <= this.getViewportHeight()) {
        this.viewportY_limit = 0;
    } else {
        this.viewportY_limit = height - this.getViewportHeight();  
    }

    this.limitViewport();
}

Camera.prototype.resizeViewport = function(width, height) {
    this.viewportWidth = width;
    this.viewportHeight = height;

    this.loadViewport(this.mapWidth, this.mapHeight);
    this.display.resize(width, height);
    this.buffer.resize(width/2, height/2);
    this.offscreenDisplay.resize(width/2, height/2);

    this.raycaster.copyScreen(this.buffer);
    this.raycaster.calculateRayData();

    this.buffer.getImageData();
    this.offscreenDisplay.getImageData();
}

Camera.prototype.getViewportWidth = function() {
    return this.viewportWidth/Camera.SCALE;
}

Camera.prototype.getViewportHeight = function() {
    return this.viewportHeight/Camera.SCALE;
}