import { UIElement } from "../uiElement.js";

export const Icon = function() {
    UIElement.call(this, "ICON");
    this.image = null;

    this.events.subscribe(UIElement.EVENT_DEBUG, "ICON", (context, localX, localY) => {
        context.save();
        context.globalAlpha = 0.5;
        context.fillStyle = "#0000ff";
        context.fillRect(localX, localY, this.image.width, this.image.height);
        context.restore();
    });

    this.events.subscribe(UIElement.EVENT_DRAW, "ICON", (context, localX, localY) => {
        if(!this.image) {
            return;
        }

        context.drawImage(this.image, localX, localY);
    });
}

Icon.prototype = Object.create(UIElement.prototype);
Icon.prototype.constructor = Icon;

Icon.prototype.setImage = function(image) {
    this.image = image;
}

Icon.prototype.getImage = function() {
    return this.image;
}