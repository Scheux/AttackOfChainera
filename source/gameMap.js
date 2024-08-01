export const GameMap = function(width, height) {
    this.width = width;
    this.height = height;
    this.tiles = [];
    this.entities = new Map();
}

GameMap.prototype.generateEmptyMap = function() {
    for(let i = 0; i < this.height; i++) {
        this.tiles[i] = [];
        for(let j = 0; j < this.width; j++) {
            this.tiles[i][j] = null;
        }
    }
}