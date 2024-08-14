import { Animation } from "./animation.js";

export const ImageSheet = function(image, config) {
    const { id, directory, source, offset, frameTime, frames, allowFlip, animations, patterns } = config;

    this.image = image;
    this.id = id;
    this.directory = directory;
    this.source = source;
    this.frames = frames;    
    this.offset = offset;
    this.frameTime = frameTime;
    this.allowFlip = allowFlip;
    this.animations = animations;
    this.patterns = patterns;
    this.buffers = new Map();
    this.loadedAnimations = new Map();

    if(!frames) {
        this.frames = {
            "0": {
                "x": 0,
                "y": 0,
                "w": image.width,
                "h": image.height   
            }
        }
    }

    if(!offset) {
        this.offset = {
            "x": 0,
            "y": 0
        }
    }

    if(!allowFlip) {
        this.allowFlip = false;
    }

    if(!frameTime) {
        this.frameTime = 1;
    }

    if(!animations) {
        this.animations = {};
    }

    if(!patterns) {
        this.patterns = {};
    }
}

ImageSheet.BUFFER_NOT_FLIPPED = 0;
ImageSheet.BUFFER_FLIPPED = 1;
ImageSheet.DEFAULT_ANIMATION_ID = "default";

ImageSheet.prototype.getFrameByID = function(frameID) {
    const frame = this.frames[frameID];

    return frame;
}

ImageSheet.prototype.getBuffersByID = function(frameID) {
    const frame = this.frames[frameID];
    const buffers = this.buffers.get(frame.frameKey);

    return buffers;
}

ImageSheet.prototype.defineFrame = function(frameID) {
    const frameData = this.frames[frameID];

    if(!frameData.frameKey) {
        const { x, y, w, h } = frameData;
        frameData.frameKey = `${x}-${y}-${w}-${h}`;
    }
    
    const { x, y, w, h, offset, frameKey } = frameData;

    if(this.buffers.has(frameKey)) {
        return;
    }

    const flipBuffers = this.allowFlip ? [false, true] : [false];

    const buffers = flipBuffers.map(isFlipped => {
        const buffer = { 
            "width": w,
            "height": h,
            "offset": { "x": this.offset.x, "y": this.offset.y },
            "bitmap": null,
            "context": null,
            "imageData": null
        };
        const bitmap = document.createElement("canvas");
        const context = bitmap.getContext("2d");
    
        bitmap.width = buffer.width;
        bitmap.height = buffer.height;

        if(offset) {
            buffer.offset.x = offset.x;
            buffer.offset.y = offset.y;
        }

        if(isFlipped) {
            context.scale(-1, 1);
            context.translate(-buffer.width, 0);
            buffer.offset.x = 0 - buffer.offset.x - buffer.width;
        } 
    
        context.drawImage(this.image, x, y, w, h, 0, 0, w, h);
        buffer.context = context;
        buffer.bitmap = bitmap;
        buffer.imageData = context.getImageData(0, 0, w, h);

        return buffer;
    });

    this.buffers.set(frameKey, buffers);
}

ImageSheet.prototype.defineFrames = function() {
    for(const key in this.frames) {
        this.defineFrame(key);
    }
}

ImageSheet.prototype.defineAnimations = function() {
    const defaultFrameKeys = Object.keys(this.frames);
    const defaultAnimation = new Animation(ImageSheet.DEFAULT_ANIMATION_ID, defaultFrameKeys, this.frameTime);

    for(const key in this.animations) {
        const { id, frames, frameTime } = this.animations[key];
        const animation = new Animation(key, frames, frameTime);

        this.loadedAnimations.set(key, animation);
    }

    this.loadedAnimations.set(ImageSheet.DEFAULT_ANIMATION_ID, defaultAnimation);
}

ImageSheet.prototype.getAnimation = function(key) {
    if(this.loadedAnimations.has(key)) {
        return this.loadedAnimations.get(key);
    } 

    if(this.frames[key]) {
        const animation = new Animation(key, [key], this.frameTime);
        this.loadedAnimations.set(key, animation);

        return animation;
    } 

    return this.loadedAnimations.get(ImageSheet.DEFAULT_ANIMATION_ID);
}

ImageSheet.prototype.getAnimationFrame = function(animationID, time) {
    const animation = this.getAnimation(animationID);
    const currentFrameTime = time % animation.frameTimeTotal;
    const frameIndex = ~~(currentFrameTime / animation.frameTime);
    const frameKey = animation.frames[frameIndex];
    const buffers = this.getBuffersByID(frameKey);

    return buffers;
}