export const GameMap = function() {
    this.id = null;
    this.music = null;
    this.width = 0;
    this.height = 0;
    this.layers = {};
    this.entities = [];
}

GameMap.prototype.generateEmptyMap = function() {
    for(let i = 0; i < this.height; i++) {
        this.tiles[i] = [];
        for(let j = 0; j < this.width; j++) {
            this.tiles[i][j] = null;
        }
    }
}

GameMap.prototype.loadConfig = function(config) {
    const { id, music, width, height, layers, entities } = config;

    this.id = id;
    this.music = music;
    this.width = width;
    this.height = height;
    this.layers = layers;
    this.entities = entities;
}