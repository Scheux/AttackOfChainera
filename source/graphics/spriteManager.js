import { IDGenerator } from "../idGenerator.js";
import { Sprite } from "./sprite.js";

export const SpriteManager = function() {
    this.tileSprites = {};
    this.spriteTypes = {};
    this.sprites = new Map();
    this.rootSprites = [];
    this.IDgenerator = new IDGenerator();
}

SpriteManager.prototype.loadSpriteTypes = function(spriteTypes) {
    if(!spriteTypes) {
        console.warn(`SpriteTypes cannot be undefined! Returning...`);
        return;
    }

    this.spriteTypes = spriteTypes;
}

SpriteManager.prototype.loadTileSprites = function(tileSprites) {
    if(!tileSprites) {
        console.warn(`TileSprites cannot be undefined! Returning...`);
        return;
    }

    this.tileSprites = tileSprites;
}

SpriteManager.prototype.workStart = function() {}

SpriteManager.prototype.workEnd = function() {
    this.rootSprites = [];
    this.sprites.clear();
    this.IDgenerator.reset();
}

SpriteManager.prototype.createSprite = function(spriteTypeID, isRooted, spriteAnimationID, timeStamp) {
    const spriteID = this.IDgenerator.getID();
    const sprite = new Sprite(spriteID, spriteTypeID);

    this.sprites.set(sprite.id, sprite);
    sprite.onFinish = (entity) => this.removeSprite(entity.id);
    this.updateSprite(sprite.id, spriteTypeID, spriteAnimationID);

    if(isRooted) {
        sprite.openFamily(spriteTypeID);
        this.addToRoot(sprite);
    }

    if(timeStamp) {
        sprite.setLastCallTime(timeStamp);
    }

    return sprite;
}

SpriteManager.prototype.removeSprite = function(spriteID) {
    const sprite = this.sprites.get(spriteID);

    if(!sprite) {
        console.warn(`Sprite ${spriteID} does not exist!`);
    }
    
    sprite.closeFamily();
    this.sprites.delete(sprite.id);
    this.removeFromRoot(sprite);
}

SpriteManager.prototype.getSprite = function(spriteID) {
    const sprite = this.sprites.get(spriteID);

    if(!sprite) {
        console.warn(`Sprite ${spriteID} does not exist!`);
        return null;
    }

    return sprite;
}

SpriteManager.prototype.addChildSprite = function(parentSpriteID, memberSpriteTypeID, customChildID) {
    if(!this.sprites.has(parentSpriteID)) {
        console.warn(`Sprite ${parentSpriteID} does not exist!`);
        return null;
    }

    const parent = this.sprites.get(parentSpriteID);
    const childSprite = this.createSprite(memberSpriteTypeID);

    parent.addChild(childSprite, customChildID);

    return childSprite;
}

SpriteManager.prototype.removeChildSprite = function(parentSpriteID, customChildID) {
    if(!this.sprites.has(parentSpriteID)) {
        console.warn(`Sprite ${parentSpriteID} does not exist!`);
        return;
    }

    const parent = this.sprites.get(parentSpriteID);
    const childSprite = parent.removeChild(customChildID);

    if(!childSprite) {
        console.warn(`Child ${customChildID} does not exist for ${parentSpriteID}`);
        return;
    }

    this.removeSprite(childSprite.reference.id);        
}

SpriteManager.prototype.addToRoot = function(sprite) {
    const index = this.rootSprites.findIndex(member => member.id === sprite.id);

    if(index === -1) {
        this.rootSprites.push(sprite);
    }
}

SpriteManager.prototype.removeFromRoot = function(sprite) {
    const index = this.rootSprites.findIndex(member => member.id === sprite.id);

    if(index !== -1) {
        this.rootSprites.splice(index, 1);
    }
}

SpriteManager.prototype.updateSprite = function(spriteID, newSpriteTypeID, newSpriteAnimationID) {
    const sprite = this.sprites.get(spriteID);

    if(!sprite) {
        console.warn(`Sprite ${spriteID} does not exist! Returning...`);
        return;
    }

    if(!newSpriteTypeID) {
        console.warn(`SpriteType ${newSpriteTypeID} does not exist! Returning...`);
        return;
    }

    if(!newSpriteAnimationID) {
        console.warn(`SpriteAnimation ${newSpriteAnimationID} on SpriteType ${newSpriteTypeID} does not exist. Proceeding with "default".`);
    }

    const spriteConfig = this.spriteTypes[newSpriteTypeID];

    if(!spriteConfig) {
        console.warn(`SpriteType ${newSpriteTypeID} does not exist! Returning...`);
        return;
    }

    const animationConfig = spriteConfig.getAnimation(newSpriteAnimationID);

    sprite.override(spriteConfig, animationConfig);
}