export const Camera = function(screenWidth, screenHeight) {
    this.viewportX = 0;
    this.viewportY = 0;
    this.viewportWidth = screenWidth;
    this.viewportHeight = screenHeight;

    this.display = document.getElementById("canvas");
    this.displayContext = this.display.getContext("2d");
    this.displayContext.imageSmoothingEnabled = false;
    this.display.width = this.viewportWidth;
    this.display.height = this.viewportHeight;

    this.buffer = document.createElement("canvas");
    this.bufferContext = this.display.getContext("2d");
    this.bufferContext.imageSmoothingEnabled = false;
}

Camera.SCALE = 1;
Camera.TILE_WIDTH = 64;
Camera.TILE_HEIGHT = 64;

Camera.prototype.drawSprites = function() {}

Camera.prototype.update = function(gameContext) {
    this.drawTileMap(gameContext);
}

Camera.prototype.drawTileMap = function(gameContext) {
    const { mapLoader, timer, tileHandler } = gameContext;
    const realTime = timer.getRealTime();
    const activeMap = mapLoader.getActiveMap();

    /*if(!activeMap) {
        return;
    }*/

    const offsetX = 0;
    const offsetY = 1;
    const startX = Math.floor(this.viewportX / Camera.TILE_WIDTH);
    const startY = Math.floor(this.viewportY / Camera.TILE_HEIGHT);
    const endX = startX + Math.floor(this.viewportWidth / Camera.TILE_WIDTH) + offsetX;
    const endY = startY + Math.floor(this.viewportHeight / Camera.TILE_HEIGHT) + offsetY;
   
    for(let i = startY; i <= endY; i++) {
        /*const tileRow = layer[i];

        if(!tileRow) {
            continue;
        }*/

        const renderY = i * Camera.TILE_HEIGHT - this.viewportY;

        for(let j = startX; j <= endX; j++) {
            /*const tile = tileRow[j];

            if(!tile) {
                continue;
            }*/

            const renderX = j * Camera.TILE_WIDTH - this.viewportX;

            this.displayContext.fillStyle = "red";
            this.displayContext.fillRect(renderX, renderY, Camera.TILE_WIDTH, Camera.TILE_HEIGHT);
        }
    }
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
    const width = mapWidth * this.renderWidth;
    const height = mapHeight * this.renderHeight;

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
}

Camera.prototype.getViewportWidth = function() {
    return this.viewportWidth/Camera.SCALE;
}

Camera.prototype.getViewportHeight = function() {
    return this.viewportHeight/Camera.SCALE;
}