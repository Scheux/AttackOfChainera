export const Tile = function() {
    this.config = null;
    this.position = null;
    this.entityPointers = new Set();
}

Tile.prototype.hasEntity = function(entityId) {
    return this.entityPointers.has(entityId);
}

Tile.prototype.addEntity = function(entityId) {
    this.entityPointers.add(entityId);
}

Tile.prototype.removeEntity = function(entityId) {
    this.entityPointers.delete(entityId);
}

Tile.prototype.getFirstEntity = function() {
    const iterator = this.entityPointers.values();
    const firstEntity = iterator.next().value;
    
    return firstEntity;
}

Tile.prototype.setConfig = function(config) {
    if(!config) {
        console.warn(`Tile configuration cannot be undefined! Returning...`);
        return;
    }
  
    this.config = config;  
}

Tile.prototype.getConfig = function() {
    return this.config;
}

Tile.prototype.setPosition = function(positionVector) {
    if(!positionVector) {
        console.warn(`Tile position cannot be undefined! Returning...`);
        return;
    }

    this.position = positionVector;
}

Tile.prototype.getPosition = function() {
    return this.position;
}