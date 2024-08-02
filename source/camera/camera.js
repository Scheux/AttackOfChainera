import { Canvas } from "./canvas.js";
import { Raycaster } from "./raycaster.js";

export const Camera = function(screenWidth, screenHeight) {
    this.viewportX = 0;
    this.viewportY = 0;
    this.viewportWidth = screenWidth;
    this.viewportHeight = screenHeight;
    this.viewportX_limit = 0;
    this.viewportY_limit = 0;

    this.fps = 0;
    this.smoothedFPS = 60;
    this.smoothingFactor = 0.02;
    
    this.raycaster = null;
    this.display = new Canvas().useExistingElement(screenWidth, screenHeight, "canvas");

    window.addEventListener("resize", () => this.resizeViewport(window.innerWidth, window.innerHeight));
}

Camera.SCALE = 1;
Camera.TILE_WIDTH = 64;
Camera.TILE_HEIGHT = 64;
Camera.EVENT_LEVEL_LOAD = 0;
Camera.EVENT_WINDOW_RESIZE = 1;

Camera.prototype.drawSprites = function(gameContext) {
    const { spriteManager } = gameContext;
}

Camera.prototype.drawLayer = function(gameContext, layer, startX, startY, endX, endY) {
    if(!layer) {
        return;
    }

    const { timer, spriteManager } = gameContext;
    const realTime = timer.getRealTime();

    for(let i = startY; i <= endY; i++) {
        const tileRow = layer[i];

        if(tileRow === undefined) {
            continue;
        }

        const renderY = i * Camera.TILE_HEIGHT - this.viewportY;
        
        for(let j = startX; j <= endX; j++) {
            
            if(tileRow[j] === undefined) {
                continue;
            }

            const renderX = j * Camera.TILE_WIDTH - this.viewportX;
            const tileGraphics = ["wall", "default"]; //tileRow[j];
            const [tileSetID, tileSetAnimationID] = tileGraphics;
            const tileSet = spriteManager.tileSprites[tileSetID];
            const buffers = tileSet.getAnimationFrame(tileSetAnimationID, realTime);
            const buffer = buffers[0];

            this.display.context.drawImage(buffer.bitmap, 
                0, 0, buffer.width, buffer.height,
                renderX + buffer.offset.x, renderY + buffer.offset.y, Camera.TILE_WIDTH, Camera.TILE_HEIGHT
            );
        }
    }
}

Camera.prototype.draw2DMap = function(gameContext) {
    const { mapLoader } = gameContext;
    const gameMap = mapLoader.getActiveMap();

    if(!gameMap) {
        return;
    }

    const offsetX = 0;
    const offsetY = 1;
    const startX = Math.floor(this.viewportX / Camera.TILE_WIDTH);
    const startY = Math.floor(this.viewportY / Camera.TILE_HEIGHT);
    const endX = Math.floor((this.viewportX + this.getViewportWidth()) / Camera.TILE_WIDTH) + offsetX;
    const endY = Math.floor((this.viewportY + this.getViewportHeight()) / Camera.TILE_HEIGHT) + offsetY;

    const layerBottom = gameMap.layers["bottom"];
    const layerFloor = gameMap.layers["floor"];
    const layerTop = gameMap.layers["top"];

    this.drawLayer(gameContext, layerBottom, startX, startY, endX, endY);
    this.drawLayer(gameContext, layerFloor, startX, startY, endX, endY);
    this.drawSprites(gameContext, gameMap.entities, startX, startY, endX, endY)
    this.drawLayer(gameContext, layerTop, startX, startY, endX, endY);
}

Camera.prototype.calculateFPS = function(passedTime) {
    const fps = 1 / passedTime;
    const smoothedFPS = (fps - this.smoothedFPS) * this.smoothingFactor;

    this.fps = fps;
    this.smoothedFPS += smoothedFPS;
}

Camera.prototype.update = function(gameContext) {
    const { timer } = gameContext; 
    const deltaTime = timer.getDeltaTime();

    this.display.clear();
    this.calculateFPS(deltaTime);

    this.draw2DMap(gameContext);
    //this.drawRaycaster(gameContext);

    this.display.context.fillStyle = "#ffffff";
    this.display.context.font = "30px Arial";
    this.display.context.fillText(`FPS: ${Math.floor(this.smoothedFPS)}`, 0, 25);
}

Camera.prototype.drawRaycaster = function(gameContext) {
    if(!this.raycaster) {
        return;
    }

    const { timer, spriteManager } = gameContext; 
    const realTime = timer.getRealTime();

    const graphics = [["test_raycast", "grass"], ["test_raycast", "water"], ["test_raycast", "meadow"], ["test_raycast", "ocean"]].map(([setID, animationID]) => {
        const tileSet = spriteManager.tileSprites[setID];
        const buffers = tileSet.getAnimationFrame(animationID, realTime);
        const buffer = buffers[0];

        return buffer;
    });

    this.raycaster.copyPosition(gameContext.player.position3D);
    this.raycaster.raycast(gameContext, graphics);

    this.display.context.drawImage(this.raycaster.display.canvas, 0, 0, this.display.width, this.display.height);
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

Camera.prototype.initializeRaycaster = function() {
    this.raycaster = new Raycaster();
    this.raycaster.display.resize(this.display.width / 2, this.display.height / 2);
    this.raycaster.display.getImageData();
    this.raycaster.copyScreen();
    this.raycaster.calculateRayData();
}

Camera.prototype.resizeViewport = function(width, height) {
    this.viewportWidth = width;
    this.viewportHeight = height;

    this.loadViewport(this.mapWidth, this.mapHeight);
    this.display.resize(width, height);

    if(this.raycaster) {
        this.raycaster.display.resize(width / 2, height / 2);
        this.raycaster.display.getImageData();
        this.raycaster.copyScreen();
        this.raycaster.calculateRayData();
    }
}

Camera.prototype.getViewportWidth = function() {
    return this.viewportWidth/Camera.SCALE;
}

Camera.prototype.getViewportHeight = function() {
    return this.viewportHeight/Camera.SCALE;
}