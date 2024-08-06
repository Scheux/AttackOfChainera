import { EventEmitter } from "../events/eventEmitter.js";
import { Drawable } from "./drawable.js";

export const Sprite = function(id, DEBUG_NAME) {
    Drawable.call(this, DEBUG_NAME);
    this.id = id;
    this.config = null;
    this.animation = null;
    this.lastCallTime = null;
    this.floatFrame = 0;
    this.currentFrame = 0;
    this.loopCount = 0;
    this.loopLimit = 0;
    this.isStatic = false;
    this.isRepeating = true;
    this.isFlipped = false;
    this.isFinished = false;

    this.events = new EventEmitter();
    this.events.listen(Sprite.FINISHED);
}

Sprite.FINISHED = 0;

Sprite.prototype = Object.create(Drawable.prototype);
Sprite.prototype.constructor = Sprite;

Sprite.prototype.override = function(config, animation) {
    this.config = config;
    this.animation = animation;
    this.lastCallTime = null;
    this.floatFrame = 0;
    this.currentFrame = 0;
    this.loopCount = 0;
    this.loopLimit = 0;
    this.isStatic = false;
}

Sprite.prototype.setLastCallTime = function(lastCallTime) {
    this.lastCallTime = lastCallTime;
}

Sprite.prototype.getConfig = function() {
    return this.config;
}

Sprite.prototype.getAnimation = function() {
    return this.animation;
}

Sprite.prototype.getCurrentFrame = function() {
    const frameKey = this.animation.frames[this.currentFrame];
    const frame = this.config.getFrameByID(frameKey);

    return frame;
}

Sprite.prototype.getPositionData = function(viewportX, viewportY, rootLocalX, rootLocalY) {
    const { x, y, w, h, offset } = this.getCurrentFrame();

    let offsetX = this.config.offset.x;
    let offsetY = this.config.offset.y;
    
    if(offset) {
        offsetX = offset.x;
        offsetY = offset.y;
    }

    if(this.isFlipped) {
        offsetX =  0 - offsetX - w;
    }

    const spriteX = this.position.x + offsetX;
    const spriteY = this.position.y + offsetY;
    const localX = rootLocalX + this.position.x;
    const localY = rootLocalY + this.position.y;
    const renderX = localX + offsetX - viewportX;
    const renderY = localY + offsetY - viewportY;

    return { spriteX, spriteY, localX, localY, renderX, renderY, sourceX: x, sourceY: y, sourceWidth: w, sourceHeight: h }
}

Sprite.prototype.setLoop = function(isLooping) {
    this.isRepeating = isLooping;
}

Sprite.prototype.setLoopLimit = function(loopLimit) {
    this.loopLimit = loopLimit;
}

Sprite.prototype.setStatic = function(isStatic = false) {
    this.isStatic = isStatic;
}

Sprite.prototype.setFrame = function(frameIndex = this.currentFrame) {
    if(this.animation.frames[frameIndex] !== undefined) {
        this.floatFrame = frameIndex;
        this.currentFrame = frameIndex;
    }
}

Sprite.prototype.flip = function(isFlipped) {
    if(!this.config.allowFlip) {
        return;
    }

    if(isFlipped === undefined) {
        isFlipped = !this.isFlipped;
    }

    this.isFlipped = isFlipped;
}

Sprite.prototype.updateFrame = function(passedFrames = 0) {
    if(this.isStatic) {
        return;
    }

    this.floatFrame += passedFrames;
    this.currentFrame = (this.floatFrame % this.animation.frameCount) | 0;

    if(passedFrames === 0) {
        return;
    }

    while(this.floatFrame >= this.animation.frameCount) {
        this.floatFrame -= this.animation.frameCount;
        this.loopCount ++;
    }

    if(!this.isRepeating && this.loopCount > this.loopLimit) {
        this.setVisible(false);
        this.setStatic(true);
        this.isFinished = true;
        this.events.emit(Sprite.FINISHED, this);
    }
}

Sprite.prototype.updateChildren = function(timeStamp, timeStep) {
    if(!this.family) {
        return;
    }

    const children = this.family.getAllChildren();

    children.forEach(child => {
        const reference = child.getReference();

        reference.receiveUpdate(timeStamp, timeStep);
    });
}

Sprite.prototype.receiveUpdate = function(timeStamp, timeStep) {
    if(this.lastCallTime === null) {
        this.lastCallTime = timeStamp;
    }

    const deltaTime = timeStamp - this.lastCallTime;
    const passedFrames = deltaTime / this.animation.frameTime;

    this.lastCallTime = timeStamp;
    this.updateFrame(passedFrames);
    this.updateChildren(timeStamp, timeStep);
}

Sprite.prototype.draw = function(context, viewportX, viewportY, rootLocalX, rootLocalY) {
    if(!this.isVisible || !this.config.image) {
        return;
    }

    const positionData = this.getPositionData(viewportX, viewportY, rootLocalX, rootLocalY);
    let { localX, localY, renderX, renderY, sourceX, sourceY,sourceWidth, sourceHeight } = positionData;

    context.save();  

    if(this.isFlipped) {
        context.translate(renderX + sourceWidth, 0);
        context.scale(-1, 1);
        renderX = 0;
    }

    context.drawImage(
        this.config.image, 
        sourceX, sourceY, sourceWidth, sourceHeight, 
        renderX, renderY, sourceWidth, sourceHeight
    );

    context.restore();

    this.drawChildren(context, viewportX, viewportY, localX, localY);
}
