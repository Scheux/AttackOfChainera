export const Camera = function(screenWidth, screenHeight) {
    this.viewportX = 0;
    this.viewportY = 0;
    this.viewportWidth = screenWidth;
    this.viewportHeight = screenHeight;

    this.display = document.getElementById("canvas");
    this.displayContext = this.display.getContext("2d");
    this.displayContext.imageSmoothingEnabled = false;

    this.buffer = document.createElement("canvas");
    this.bufferContext = this.display.getContext("2d");
    this.bufferContext.imageSmoothingEnabled = false;
}

Camera.prototype.drawSprites = function() {}