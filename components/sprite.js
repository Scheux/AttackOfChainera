export const SpriteComponent = function() {
    this.spriteID = null;
} 

SpriteComponent.prototype.getSpriteID = function() {
    return this.spriteID;
}

SpriteComponent.prototype.setSpriteID = function(spriteID) {
    this.spriteID = spriteID;
}