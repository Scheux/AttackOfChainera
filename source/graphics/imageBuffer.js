export const ImageBuffer = function(image) {
    this.width = image.width;
    this.height = image.height;
    this.bitmap = document.createElement("canvas");
    this.bitmap.width = image.width;
    this.bitmap.height = image.height;
    this.context = this.bitmap.getContext("2d");
    this.context.imageSmoothingEnabled = false;
    this.context.drawImage(image, 0, 0);
    this.imageData = this.context.getImageData(0, 0, image.width, image.height);
}