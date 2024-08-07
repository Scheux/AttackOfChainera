export const GameMap = function(id, config) {
    const { music, width, height, layerOpacity, layers, tiles, connections, entities, flags } = config;

    this.id = id;
    this.music = null;
    this.width = 0;
    this.height = 0;
    this.layerOpacity = { "collision": 1, "bottom": 1, "floor": 1, "top": 1 };
    this.layers = { "collision": [], "bottom": [], "floor": [], "top": [] };
    this.tiles = [];
    this.connections = [];
    this.entities = [];
    this.flags = {};

    if(music) {
        this.music = music;
    }

    if(width) {
        this.width = width;
    }

    if(height) {
        this.height = height;
    }

    if(layerOpacity) {
        this.layerOpacity = layerOpacity;
    }

    if(layers) {
        this.layers = layers;
    }
    
    if(tiles) {
        this.tiles = tiles;
    }

    if(connections) {
        this.connections = connections;
    }

    if(entities) {
        this.entities = entities;
    }

    if(flags) {
        this.flags = flags;
    }
}

GameMap.prototype.generateEmptyLayer = function(layerID, placementID) {
    this.layers[layerID] = [];

    for(let i = 0; i < this.height; i++) {
        this.layers[layerID][i] = [];

        for(let j = 0; j < this.width; j++) {
            this.layers[layerID][i][j] = placementID;
        }
    }
}

GameMap.prototype.resize = function(width, height) {
    for(const key in this.layers) {
        const layer = this.layers[key];

        if(height < this.height) {
            layer.length = height;
        }

        for(let i = 0; i < height; i++) {
            const row = layer[i];

            if(width < this.width) {
                row.length = width;
            }
        }

        for(let i = 0; i < height; i++) {
            
            if(layer[i] === undefined) {
                layer[i] = [];
            }

            const row = layer[i];

            for(let j = 0; j < width; j++) {

                if(row[j] === undefined) {
                    row[j] = null;
                }
            }   
        }
    }

    this.width = width;
    this.height = height;
}

GameMap.prototype.placeTile = function(graphics, layerID, tileX, tileY) {
    if(!this.layers[layerID]) {
        console.warn(`Layer ${layerID} does not exist! Returning...`);
        return;
    }

    const layer = this.layers[layerID];
    
    if(layer[tileY] === undefined) {
        console.warn(`Row ${tileY} of layer ${layerID} does not exist! Returning...`);
        return;
    }

    const row = layer[tileY];

    if(row[tileX] === undefined) {
        console.warn(`Tile ${tileX} of row ${tileY} of layer ${layerID} does not exist! Returning...`);
        return;
    }

    row[tileX] = graphics;
}

GameMap.prototype.getConnections = function() {
    return this.connections;
}

GameMap.prototype.outOfBounds = function(tileX, tileY) {
    return tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.width;
}

GameMap.prototype.getTile = function(layerID, tileX, tileY) {
    if(!this.layers[layerID]) {
        console.warn(`Layer ${layerID} does not exist! Returning null...`);
        return null;
    }

    if(!this.layers[layerID][tileY]) {
        console.warn(`Row ${tileY} of layer ${layerID} does not exist! Returning null...`);
        return null;
    }

    return this.layers[layerID][tileY][tileX];
}