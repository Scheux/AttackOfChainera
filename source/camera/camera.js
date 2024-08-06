import { EventEmitter } from "../events/eventEmitter.js";
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

    this.events = new EventEmitter();
    this.events.listen(Camera.EVENT_SCREEN_RESIZE);
    this.events.listen(Camera.EVENT_MAP_RENDER_COMPLETE);

    window.addEventListener("resize", () => this.resizeViewport(window.innerWidth, window.innerHeight));
}

Camera.DRAW_2D_MAP = true;
Camera.DRAW_RAYCAST = false;
Camera.SCALE = 4;
Camera.TILE_WIDTH = 16;
Camera.TILE_HEIGHT = 16;
Camera.EVENT_SCREEN_RESIZE = 0;
Camera.EVENT_MAP_RENDER_COMPLETE = 1;

Camera.prototype.drawSprites = function(gameContext) {
    const { timer, spriteManager } = gameContext;
    const { rootSprites } = spriteManager;
    const realTime = timer.getRealTime();
    const timeStep = timer.getFixedDeltaTime();
    const visibleSprites = [];
    const length = rootSprites.length;
    const viewportLeftEdge = this.viewportX;
    const viewportTopEdge = this.viewportY;
    const viewportRightEdge = viewportLeftEdge + this.getViewportWidth();
    const viewportBottomEdge = viewportTopEdge + this.getViewportHeight();

    for(let i = 0; i < length; i++) {
        const sprite = rootSprites[i];
        const positionData = sprite.getPositionData(this.viewportX, this.viewportY, 0, 0);     
        const { spriteX, spriteY, sourceWidth, sourceHeight } = positionData;
        const inBounds = spriteX < viewportRightEdge && spriteX + sourceWidth > viewportLeftEdge && spriteY < viewportBottomEdge && spriteY + sourceHeight > viewportTopEdge;

        if(inBounds) {
            visibleSprites.push(sprite);
        }
    }

    visibleSprites.sort((a, b) => (a.position.y) - (b.position.y));

    for(let i = 0; i < visibleSprites.length; i++) {
        const sprite = visibleSprites[i];
        sprite.receiveUpdate(realTime, timeStep);
        sprite.draw(this.display.context, this.viewportX, this.viewportY, 0, 0);
    }
}

Camera.prototype.drawTile = function(gameContext, tileX, tileY, tileGraphics) {
    const { timer, spriteManager } = gameContext;
    const realTime = timer.getRealTime();

    const renderY = tileY * Camera.TILE_HEIGHT - this.viewportY;
    const renderX = tileX * Camera.TILE_WIDTH - this.viewportX;
    const [tileSetID, tileSetAnimationID] = tileGraphics;
    const tileSet = spriteManager.tileSprites[tileSetID];
    const buffers = tileSet.getAnimationFrame(tileSetAnimationID, realTime);
    const buffer = buffers[0];

    this.display.context.drawImage(buffer.bitmap, 
        0, 0, buffer.width, buffer.height,
        renderX + buffer.offset.x, renderY + buffer.offset.y, Camera.TILE_WIDTH, Camera.TILE_HEIGHT
    );
}

Camera.prototype.drawLayer = function(gameContext, gameMap, layerID, startX, startY, endX, endY) {
    if(!layerID) {
        return;
    }

    const { mapLoader } = gameContext;
    const neighbors = gameMap.getConnections();
    const layer = gameMap.layers[layerID];
    const opacity = gameMap.layerOpacity[layerID];

    if(!opacity) {
        return;
    }

    this.display.context.globalAlpha = opacity;

    for(let i = startY; i <= endY; i++) {
        const tileRow = layer[i];

        if(i < 0 || i >= gameMap.height) {
            for(const neighbor of neighbors) {
                if(i >= neighbor.startY && i < neighbor.endY) {
                    const neighborMap = mapLoader.getLoadedMap(neighbor.id);
                    const neighborLayer = neighborMap.layers[layerID];
                    const neighborRow = neighborLayer[i - neighbor.startY];

                    for(let j = startX; j <= endX; j++) {
                        if(j >= neighbor.startX && j < neighbor.endX) {
                            const neighborTile = neighborRow[j - neighbor.startX];
                            this.drawTile(gameContext, j, i, neighborTile);
                        }
                    }
                }
            }
            continue;
        }

        if(tileRow === undefined) {
            continue;
        }
        
        for(let j = startX; j <= endX; j++) {
            
            if(j < 0 || j >= gameMap.width) {
                for(const neighbor of neighbors) {
                    if(j >= neighbor.startX && j < neighbor.endX && i >= neighbor.startY && i < neighbor.endY) {
                        const neighborMap = mapLoader.getLoadedMap(neighbor.id);
                        const neighborLayer = neighborMap.layers[layerID];
                        const neighborRow = neighborLayer[i - neighbor.startY];
                        const neighborTile = neighborRow[j - neighbor.startX];
                        
                        this.drawTile(gameContext, j, i, neighborTile);
                    }
                }
                continue;
            }

            if(tileRow[j] === undefined || tileRow[j] === null) {
                continue;
            }

            this.drawTile(gameContext, j, i, tileRow[j]);
        }
    }

    this.display.context.globalAlpha = 1;
}

Camera.prototype.draw2DMapOutlines = function(gameContext) {
    const { mapLoader } = gameContext;
    const gameMap = mapLoader.getActiveMap();
    const lineColor = "#dddddd";

    if (!gameMap) {
        return;
    }

    this.display.context.fillStyle = lineColor;

    for (let i = 0; i <= gameMap.height; i++) {
        const renderY = i * Camera.TILE_HEIGHT * Camera.SCALE - this.viewportY * Camera.SCALE;
        this.display.context.fillRect(0, renderY, this.viewportWidth, 1);
    }

    for (let j = 0; j <= gameMap.width; j++) {
        const renderX = j * Camera.TILE_WIDTH * Camera.SCALE - this.viewportX * Camera.SCALE;
        this.display.context.fillRect(renderX, 0, 1, this.viewportHeight);
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

    this.display.context.save();
    this.display.context.scale(Camera.SCALE, Camera.SCALE);

    this.drawLayer(gameContext, gameMap, "bottom", startX, startY, endX, endY);
    this.drawLayer(gameContext, gameMap, "floor", startX, startY, endX, endY);
    this.drawSprites(gameContext, startX, startY, endX, endY)
    this.drawLayer(gameContext, gameMap, "top", startX, startY, endX, endY);
    this.drawLayer(gameContext, gameMap, "collision", startX, startY, endX, endY);

    this.display.context.restore();
}

Camera.prototype.drawUI = function(gameContext) {
    const { uiManager, timer } = gameContext;
    const { texts, drawableElements } = uiManager;
    const deltaTime = timer.getDeltaTime();

    drawableElements.forEach(element => element.drawDebug(this.display.context, 0, 0, 0, 0));
    drawableElements.forEach(element => element.draw(this.display.context, 0, 0, 0, 0));
    
    texts.forEach(text => text.receiveUpdate(deltaTime));
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

    if(Camera.DRAW_2D_MAP) {
        this.draw2DMap(gameContext);
        this.events.emit(Camera.EVENT_MAP_RENDER_COMPLETE, this);
    }

    if(Camera.DRAW_RAYCAST) {
        this.drawRaycaster(gameContext);
    }

    this.drawUI(gameContext);
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
    this.viewportX += param_dragX / Camera.SCALE;
    this.viewportY += param_dragY / Camera.SCALE;
  
    //this.limitViewport();
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

Camera.prototype.clearRaycaster = function() {
    this.raycaster = null;
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

    this.events.emit(Camera.EVENT_SCREEN_RESIZE, this.viewportWidth, this.viewportHeight);
}

Camera.prototype.getViewportWidth = function() {
    return this.viewportWidth/Camera.SCALE;
}

Camera.prototype.getViewportHeight = function() {
    return this.viewportHeight/Camera.SCALE;
}