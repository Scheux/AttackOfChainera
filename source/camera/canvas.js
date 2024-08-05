export const Canvas = function() {
    this.canvas = null;
    this.context = null;
    this.width = null;
    this.height = null;
    this.centerX = null;
    this.centerY = null;
    this.imageData = null;
}

Canvas.prototype.clear = function() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
}

Canvas.prototype.copyBuffer = function() {

}

Canvas.prototype.resize = function(width, height) {
    this.clear();

    this.canvas.width = width;
    this.canvas.height = height;

    this.width = width;
    this.height = height;

    this.centerX = width / 2;
    this.centerY = height / 2;

    this.context.imageSmoothingEnabled = false;
}

Canvas.prototype.useExistingElement = function(width, height, id) {
    this.canvas = document.getElementById(id);

    this.canvas.width = width;
    this.canvas.height = height;

    this.context = this.canvas.getContext("2d");
    this.context.imageSmoothingEnabled = false;

    this.resize(width, height);

    return this;
}

Canvas.prototype.createNewElement = function(width, height) {
    this.canvas = document.createElement("canvas");

    this.canvas.width = width;
    this.canvas.height = height;

    this.context = this.canvas.getContext("2d");
    this.context.imageSmoothingEnabled = false;

    this.resize(width, height);

    return this;
}

Canvas.prototype.getImageData = function() {
    if(!this.canvas) {
        return this;
    }

    this.imageData = this.context.getImageData(0, 0, this.width, this.height);

    return this;
}

Canvas.prototype.drawPixel = function(index, r, g, b, a) {
    const imageData = this.imageData.data;

    imageData[index] = r;
    imageData[index + 1] = g;
    imageData[index + 2] = b;
    imageData[index + 3] = a;
}