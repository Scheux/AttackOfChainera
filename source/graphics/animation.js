export const Animation = function(id, frames, frameTime) {
    this.id = id;
    this.frames = frames;
    this.frameTime = frameTime;
    this.frameCount = frames.length;
    this.frameTimeTotal = frames.length * frameTime;
    this.globalFrameKey = frames[0];
}