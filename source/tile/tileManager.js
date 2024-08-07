import { EventEmitter } from "../events/eventEmitter.js";
import { Vec2 } from "../math/vec2.js";
import { Tile } from "./tile.js";

export const TileManager = function() {
    this.tileTypes = {};
    this.tiles = [];

    this.events = new EventEmitter();
    this.events.listen(TileManager.TILE_GRAPHICS_UPDATE);
    this.events.listen(TileManager.TILE_AUTOTILE_UPDATE);
}

TileManager.TILE_GRAPHICS_UPDATE = Symbol("TILE_GRAPHICS_UPDATE");
TileManager.TILE_AUTOTILE_UPDATE = Symbol("TILE_AUTOTILE_UPDATE");

TileManager.prototype.workStart = function(tiles) {
    this.tiles = tiles;
}

TileManager.prototype.workEnd = function() {
    this.tiles = [];
    this.events.deafen(TileManager.TILE_GRAPHICS_UPDATE);
    this.events.deafen(TileManager.TILE_AUTOTILE_UPDATE);
}

TileManager.prototype.loadTileTypes = function(tileTypes) {
    if(!tileTypes) {
        console.warn(`TileTypes cannot be undefined! Returning...`);
        return;
    }

    this.tileTypes = tileTypes;
}

TileManager.prototype.createTile = function(tileType, positionVector) {
    const tile = new Tile();

    tile.setPosition(positionVector);

    if(tileType !== null) {
        this.updateTileConfig(tile, tileType);
    }

    return tile;
}

TileManager.prototype.getTile = function(tileX, tileY) {
    if(this.tiles[tileY] === undefined) {
        return undefined;
    }

    return this.tiles[tileY][tileX];
}

TileManager.prototype.updateTileConfig = function(tile, tileTypeID) {
    const tileConfig = this.tileTypes[tileTypeID];

    if(!tileConfig) {
        console.warn(`TileConfig ${tileTypeID} does not exist! Returning...`);
        return;
    }

    tile.setConfig(tileConfig);
}

TileManager.prototype.emitUpdateEvents = function(tileX, tileY, rangeX, rangeY) {
    const startX = tileX - rangeX;
    const startY = tileY - rangeY;
    const endX = tileX + rangeX + 1;
    const endY = tileY + rangeY + 1;

    for(let i = startY; i < endY; i++) {
        for(let j = startX; j < endX; j++) {
            const tile = this.getTile(j, i);

            if(!tile) {
                console.warn(`Tile [${i}][${j}] does not exist! Returning...`);
                continue;
            }

            this.events.emit(TileManager.TILE_GRAPHICS_UPDATE, tile);
            this.events.emit(TileManager.TILE_AUTOTILE_UPDATE, tile);
        }
    }
}

TileManager.prototype.getTilesInRange = function(tileVector, rangeX, rangeY) {
    const startX = tileVector.x - rangeX;
    const startY = tileVector.y - rangeY;
    const endX = tileVector.x + rangeX + 1;
    const endY  = tileVector.y + rangeY + 1;
    const tiles = [];

    for(let i = startY; i < endY; i++) {
        for(let j = startX; j < endX; j++) {
            const tile = this.getTile(j, i);

            if(!tile) {
                console.warn(`Tile [${i}][${j}] does not exist! Returning...`);
                continue;
            }

            tiles.push(tile);
        }
    }

    return tiles;
}

TileManager.prototype.applyAutoRule = function(tileVector, tileTypeID, getResult) {
    const tileType = this.tileTypes[tileTypeID];

    if(tileType.autoTile.using === "4BIT") {
        const valueSet = {"0": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, "11": 11, "12": 12, "13": 13, "14": 14, "15": 15};
        const finalValue = this.autoTile4Bit(tileVector, getResult);
        const tileValue = valueSet[finalValue];
        const tileData = tileType.autoTile["4BIT"][tileValue];
    
        if(!tileData) {
            return null;
        }
    
        return tileData;
    }

    const valueSet = {"2": 1, "8": 2, "10": 3, "11": 4, "16": 5, "18": 6, "22": 7, "24": 8, "26": 9, "27": 10, "30": 11, "31": 12, "64": 13, "66": 14, "72": 15, "74": 16, "75": 17, "80": 18, "82": 19, "86": 20, "88": 21, "90": 22, "91": 23, "94": 24, "95": 25, "104": 26, "106": 27, "107": 28, "120": 29, "122": 30, "123": 31, "126": 32, "127": 33, "208": 34, "210": 35, "214": 36, "216": 37, "218": 38, "219": 39, "222": 40, "223": 41, "248": 42, "250": 43, "251": 44, "254": 45, "255": 46, "0": 47};
    const finalValue = this.autoTile8Bit(tileVector, getResult);
    const tileValue = valueSet[finalValue];
    const tileData = tileType.autoTile["8BIT"][tileValue];

    if(!tileData) {
        return null;
    }

    return tileData;
}

TileManager.prototype.autoTile4Bit = function(tileVector, getResult) {
    let finalValue = 0;

    const center = {"tile": this.getTile(tileVector.x, tileVector.y), "value": 0};
    const north = {"tile": this.getTile(tileVector.x, tileVector.y - 1), "value": 1};
    const west = {"tile": this.getTile(tileVector.x - 1, tileVector.y), "value": 2};
    const east = {"tile": this.getTile(tileVector.x + 1, tileVector.y), "value": 4};
    const south = {"tile": this.getTile(tileVector.x, tileVector.y + 1), "value": 8};

    const isNorth = getResult(center.tile, north.tile);
    const isWest = getResult(center.tile, west.tile);
    const isEast = getResult(center.tile, east.tile);
    const isSouth = getResult(center.tile, south.tile);

    if(isNorth) {
        finalValue += north.value;
    }

    if(isWest) {
        finalValue += west.value;
    }

    if(isEast) {
        finalValue += east.value;
    }

    if(isSouth) {
        finalValue += south.value;
    }

    return finalValue;
}

TileManager.prototype.autoTile8Bit = function(tileVector, getResult) {
    let finalValue = 0;

    const center = {"tile": this.getTile(tileVector.x, tileVector.y), "value": 0};
    const northWest = {"tile": this.getTile(tileVector.x - 1, tileVector.y - 1), "value": 1};
    const north = {"tile": this.getTile(tileVector.x, tileVector.y - 1), "value": 2};
    const northEast = {"tile": this.getTile(tileVector.x + 1, tileVector.y - 1), "value": 4};
    const west = {"tile": this.getTile(tileVector.x - 1, tileVector.y), "value": 8};
    const east = {"tile": this.getTile(tileVector.x + 1, tileVector.y), "value": 16};
    const southWest = {"tile": this.getTile(tileVector.x - 1, tileVector.y + 1), "value": 32};
    const south = {"tile": this.getTile(tileVector.x, tileVector.y + 1), "value": 64};
    const southEast = {"tile": this.getTile(tileVector.x + 1, tileVector.y + 1), "value": 128};

    const isNorth = getResult(center.tile, north.tile);
    const isWest = getResult(center.tile, west.tile);
    const isEast = getResult(center.tile, east.tile);
    const isSouth = getResult(center.tile, south.tile);

    if(isNorth) {
        finalValue += north.value;
    }

    if(isWest) {
        finalValue += west.value;
    }

    if(isEast) {
        finalValue += east.value;
    }

    if(isSouth) {
        finalValue += south.value;
    }

    if(isNorth && isWest) {
        const isNorthWest = getResult(center.tile, northWest.tile);

        if(isNorthWest) {
            finalValue += northWest.value;
        }
    }

    if(isNorth && isEast) {
        const isNorthEast = getResult(center.tile, northEast.tile); 

        if(isNorthEast) {
            finalValue += northEast.value;
        }
    }

    if(isSouth && isWest) {
        const isSouthWest = getResult(center.tile, southWest.tile); 

        if(isSouthWest) {
            finalValue += southWest.value;
        }
    } 

    if(isSouth && isEast) {
        const isSouthEast = getResult(center.tile, southEast.tile); 

        if(isSouthEast) {
            finalValue += southEast.value;
        }
    }

    return finalValue;
}

TileManager.prototype.removePointers = function(tileX, tileY, rangeX, rangeY, pointer) {
    for(let i = 0; i < rangeY; i++) {
        for(let j = 0; j < rangeX; j++) {
            const locationX = tileX + j;
            const locationY = tileY + i;
            const tile = this.getTile(locationX, locationY);
            
            if(!tile) {
                console.warn(`Tile [${locationY}][${locationX}] does not exist! Continuing...`);
                continue;
            }

            tile.removeEntity(pointer);
        }
    }
}

TileManager.prototype.setPointers = function(tileX, tileY, rangeX, rangeY, pointer) {
    for(let i = 0; i < rangeY; i++) {
        for(let j = 0; j < rangeX; j++) {
            const locationX = tileX + j;
            const locationY = tileY + i;
            const tile = this.getTile(locationX, locationY);
            
            if(!tile) {
                console.warn(`Tile [${locationY}][${locationX}] does not exist! Continuing...`);
                continue;
            }

            tile.addEntity(pointer);
        }
    }
}

TileManager.prototype.updateAllTiles = function() {
    for(let i = 0; i < this.tiles.length; i++) {
        for(let j = 0; j < this.tiles[i].length; j++) {
            const tile = this.tiles[i][j];

            if(!tile) {
                console.warn(`Updating all tiles failed! Tile [${i}][${j}] does not exist! Continuing...`);
                continue;
            }

            this.emitUpdateEvents(j, i, 0, 0);
        }
    }
}

TileManager.prototype.loadTiles = function(mapWidth, mapHeight) {
    if(!this.tiles) {
        console.warn(`Tiles is undefined! Returning...`);
        return;
    }

    for(let i = 0; i < mapHeight; i++) {

        if(this.tiles[i] === undefined) {
            this.tiles[i] = [];
        }

        for(let j = 0; j < mapWidth; j++) {

            if(this.tiles[i][j] === undefined || this.tiles[i][j] === null) { 
                this.tiles[i][j] = this.createTile(null, new Vec2(j, i));
                continue;
            }

            this.tiles[i][j] = this.createTile(this.tiles[i][j], new Vec2(j, i));
        }
    }
}