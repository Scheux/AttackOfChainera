export const Minimap = function() {
    this.anchorX = 0;
    this.anchorY = 0;
    this.viewportX = 0;
    this.viewportY = 0;
    this.viewportWidth = 0;
    this.viewportHeight = 0;
}

Minimap.TILE_WIDTH = 16;
Minimap.TILE_HEIGHT = 16;

/**
 * Sets the anchor of the minimap.
 * 
 * @param {int} anchorX x-Coordinate of the minimap.
 * @param {int} anchorY y-Coordinate of the minimap.
 */
Minimap.prototype.setAnchor = function(anchorX, anchorY) {
    this.anchorX = anchorX;
    this.anchorY = anchorY;
}

/**
 * Sets the dimensions of the minimap.
 * 
 * @param {int} tileWidth How many tiles are displayed on the x-Axis.
 * @param {int} tileHeight How many tiles are displayed on the y-Axis.
 */
Minimap.prototype.setViewport = function(tileWidth, tileHeight) {
    this.viewportX = 0;
    this.viewportY = 0;
    this.viewportWidth = tileWidth * Minimap.TILE_WIDTH;
    this.viewportHeight = tileHeight * Minimap.TILE_HEIGHT;
}

Minimap.prototype.draw = function(gameContext, minimapLayer, context) {
    const { timer, spriteManager } = gameContext;
    const realTime = timer.getRealTime();
    const startX = Math.floor(this.viewportX / Minimap.TILE_WIDTH);
    const startY = Math.floor(this.viewportY / Minimap.TILE_HEIGHT);
    const endX = Math.floor((this.viewportX + this.viewportWidth) / Minimap.TILE_WIDTH);
    const endY = Math.floor((this.viewportY + this.viewportHeight) / Minimap.TILE_HEIGHT);

    context.fillStyle = "#222222";
    context.fillRect(this.anchorX + Minimap.TILE_WIDTH, this.anchorY + Minimap.TILE_HEIGHT, this.viewportWidth, this.viewportHeight);

    for(let i = startY; i <= endY; i++) {
        const row = minimapLayer[i];
        const renderY = i * Minimap.TILE_HEIGHT - this.viewportY + Minimap.TILE_HEIGHT;

        if(!row) {
            continue;
        }

        for(let j = startX; j <= endX; j++) {
            const tile = row[j];
            const renderX = j * Minimap.TILE_WIDTH - this.viewportX + Minimap.TILE_WIDTH;

            if(tile === undefined || tile === null) {
                continue;
            }

            const [tileSetID, tileSetAnimationID] = tile;
            const tileSet = spriteManager.tileSprites[tileSetID];
            const buffers = tileSet.getAnimationFrame(tileSetAnimationID, realTime);
            const buffer = buffers[0];
    
            context.drawImage(
                buffer.bitmap, 
                0, 0, buffer.width, buffer.height,
                renderX, renderY, Minimap.TILE_WIDTH, Minimap.TILE_HEIGHT
            );
        }
    }

    context.fillStyle = "#000000";
    context.fillRect(0, 0, this.viewportWidth + Minimap.TILE_WIDTH, Minimap.TILE_HEIGHT);
    context.fillRect(0, 0, Minimap.TILE_WIDTH, this.viewportHeight + Minimap.TILE_HEIGHT);
    context.fillRect(this.viewportWidth + Minimap.TILE_WIDTH, 0, Minimap.TILE_WIDTH, this.viewportHeight + Minimap.TILE_HEIGHT * 2);
    context.fillRect(0, this.viewportHeight + Minimap.TILE_HEIGHT, this.viewportWidth + Minimap.TILE_WIDTH * 2, Minimap.TILE_HEIGHT);

    context.fillStyle = "#eeeeee";
    context.fillRect(this.viewportWidth / 2 - 2 + Minimap.TILE_WIDTH, this.viewportHeight / 2 - 2 + Minimap.TILE_HEIGHT, 4, 4);
}

/**
 * Centers the minimaps viewport on a position.
 * 
 * @param {float} positionX 
 * @param {float} positionY 
 */
Minimap.prototype.center = function(positionX, positionY) {
    const targetX = positionX - this.viewportWidth / 2;
    const targetY = positionY - this.viewportHeight / 2;

    this.viewportX = targetX;
    this.viewportY = targetY;
}