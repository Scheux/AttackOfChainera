export const GameMap = function(id, config) {
    const { music, width, height, layers, tiles, connections, entities, flags } = config;

    this.id = id;
    this.music = music;
    this.width = width;
    this.height = height;
    this.layers = layers;
    this.tiles = tiles;
    this.connections = connections;
    this.entities = entities;
    this.flags = flags;
}

GameMap.prototype.generateEmptyLayer = function(layerID) {
    this.layers[layerID] = [];

    for(let i = 0; i < this.height; i++) {
        this.layers[layerID][i] = [];

        for(let j = 0; j < this.width; j++) {
            this.layers[layerID][i][j] = null;
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