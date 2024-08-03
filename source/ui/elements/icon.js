import { UIElement } from "../uiElement.js";

export const Icon = function() {
    UIElement.call(this, "ICON");
    this.image = null;
}

Icon.prototype = Object.create(UIElement.prototype);
Icon.prototype.constructor = Icon;

Icon.prototype.draw = function(context, viewportX, viewportY, rootLocalX, rootLocalY) {
    if(!this.image) {
        return;
    }

    const localX = rootLocalX + this.position.x;
    const localY = rootLocalY + this.position.y;
    const renderX = localX - viewportX;
    const renderY = localY - viewportY;

    context.drawImage(this.image, renderX, renderY);
    this.drawChildren(context, viewportX, viewportY, localX, localY);
}

Icon.prototype.setImage = function(image) {
    this.image = image;
}

Icon.prototype.getImage = function() {
    return this.image;
}

Icon.prototype.drawDebug = function(context) {
    context.save();
    context.globalAlpha = 0.5;
    context.fillStyle = "#0000ff";
    context.fillRect(this.position.x, this.position.y, this.image.width, this.image.height);
    context.restore();
}