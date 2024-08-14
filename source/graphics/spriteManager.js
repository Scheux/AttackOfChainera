import { IDGenerator } from "../idGenerator.js";
import { ImageSheet } from "./imageSheet.js";
import { Sprite } from "./sprite.js";

export const SpriteManager = function() {
    this.tileSprites = {};
    this.spriteTypes = {};
    this.sprites = new Map();
    this.rootSprites = [];
    this.IDgenerator = new IDGenerator();
}

SpriteManager.prototype.update = function(gameContext) {
    const { timer } = gameContext;
    const realTime = timer.getRealTime();
    
    for(const key in this.tileSprites) {
        const tileSet = this.tileSprites[key];

        for(const [animationID, animation] of tileSet.loadedAnimations) {
            const currentFrameTime = realTime % animation.frameTimeTotal;
            const frameIndex = (currentFrameTime / animation.frameTime) | 0;
            const frameKey = animation.frames[frameIndex];

            animation.globalFrameKey = frameKey;
        }
    }
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

SpriteManager.prototype.workEnd = function() {
    this.rootSprites = [];
    this.sprites.clear();
    this.IDgenerator.reset();
}

SpriteManager.prototype.createSprite = function(spriteTypeID, isRooted, spriteAnimationID, timeStamp) {
    const spriteID = this.IDgenerator.getID();
    const sprite = new Sprite(spriteID, spriteTypeID);

    sprite.events.subscribe(Sprite.FINISHED, "SPRITE_MANAGER", sprite => this.removeSprite(sprite.id));
    
    this.sprites.set(sprite.id, sprite);
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
        console.warn(`Sprite ${spriteID} does not exist! Returning...`);
        return;
    }
    
    sprite.closeFamily();
    this.sprites.delete(sprite.id);
    this.removeFromRoot(sprite);
}

SpriteManager.prototype.getSprite = function(spriteID) {
    const sprite = this.sprites.get(spriteID);

    if(!sprite) {
        console.warn(`Sprite ${spriteID} does not exist! Returning null...`);
        return null;
    }

    return sprite;
}

SpriteManager.prototype.addChildSprite = function(parentSpriteID, memberSpriteTypeID, customChildID) {
    if(!this.sprites.has(parentSpriteID)) {
        console.warn(`Sprite ${parentSpriteID} does not exist! Returning...`);
        return null;
    }

    const parent = this.sprites.get(parentSpriteID);
    const childSprite = this.createSprite(memberSpriteTypeID);

    parent.addChild(childSprite, customChildID);

    return childSprite;
}

SpriteManager.prototype.removeChildSprite = function(parentSpriteID, customChildID) {
    if(!this.sprites.has(parentSpriteID)) {
        console.warn(`Sprite ${parentSpriteID} does not exist! Returning...`);
        return;
    }

    const parent = this.sprites.get(parentSpriteID);
    const childSprite = parent.removeChild(customChildID);

    if(!childSprite) {
        console.warn(`Child ${customChildID} does not exist for ${parentSpriteID}! Returning...`);
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

SpriteManager.prototype.updateSprite = function(spriteID, setID, animationID) {
    const sprite = this.sprites.get(spriteID);

    if(!sprite) {
        console.warn(`Sprite ${spriteID} does not exist! Returning...`);
        return;
    }

    if(!setID) {
        console.warn(`SpriteSet ${setID} does not exist! Returning...`);
        return;
    }

    if(!animationID) {
        console.warn(`SpriteAnimation ${animationID} on SpriteSet ${setID} does not exist. Using "default". Proceeding...`);
        animationID = "default";
    }

    const setConfig = this.spriteTypes[setID];

    if(!setConfig) {
        console.warn(`SpriteSet ${setID} does not exist! Returning...`);
        return;
    }

    const animationConfig = setConfig.getAnimation(animationID);

    sprite.override(setConfig, animationConfig);
}

SpriteManager.prototype.getTileBuffer = function(tileSetID, tileSetAnimationID) {
    const tileSet = this.tileSprites[tileSetID];
    const animation = tileSet.getAnimation(tileSetAnimationID);
    const buffers = tileSet.getBuffersByID(animation.globalFrameKey);

    return buffers[ImageSheet.BUFFER_NOT_FLIPPED];
}