import { UIElement } from "../uiElement.js";

export const Icon = function() {
    UIElement.call(this, "ICON");
    this.image = null;
    
    this.events.subscribe(UIElement.EVENT_DEBUG, "ICON", (context, localX, localY) => {
        context.save();
        context.globalAlpha = 0.5;
        context.fillStyle = "#0000ff";
        context.fillRect(localX, localY, this.width, this.height);
        context.restore();
    });
}

Icon.prototype = Object.create(UIElement.prototype);
Icon.prototype.constructor = Icon;

Icon.prototype.postDraw = function(context, localX, localY) {
    if(!this.image) {
        return;
    }

    context.drawImage(this.image, localX, localY, this.width, this.height);
}

Icon.prototype.setImage = function(image) {
    this.image = image;
    this.width = image.width;
    this.height = image.height;
}

Icon.prototype.getImage = function() {
    return this.image;
}