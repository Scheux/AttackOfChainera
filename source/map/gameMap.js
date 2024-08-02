export const GameMap = function(id, config) {
    const { music, width, height, collisions, layers, tiles, connections, entities, flags } = config;

    this.id = id;
    this.music = music;
    this.width = width;
    this.height = height;
    this.collisions = collisions;
    this.layers = layers;
    this.tiles = tiles;
    this.connections = connections;
    this.entities = entities;
    this.flags = flags;
}

GameMap.prototype.generateEmptyLayer = function(layerID) {
    const layer = this.layers[layerID];

    if(!layer) {
        console.warn(`LayerIndex ${layerIndex} does not exist on map ${this.id}! Returning...`);
        return;
    }

    for(let i = 0; i < this.height; i++) {
        layer[i] = [];
        for(let j = 0; j < this.width; j++) {
            layer[i][j] = null;
        }
    }
}

