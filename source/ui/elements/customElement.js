import { Vec2 } from "../../math/vec2.js";
import { UIElement } from "../uiElement.js";

export const CustomElement = function() {
    UIElement.call(this, "CustomElement");
    this.offset = new Vec2(0, 0);
    this.width = 0;
    this.height = 0;
    this.buffer = null;
    this.context = null;
}

CustomElement.prototype = Object.create(UIElement.prototype);
CustomElement.prototype.constructor = CustomElement;

CustomElement.prototype.createBuffer = function(width, height) {
    this.buffer = document.createElement("canvas");
    this.context = this.buffer.getContext("2d");
    this.context.imageSmoothingEnabled = false;

    this.width = width;
    this.height = height;
    this.buffer.width = width;
    this.buffer.height = height;
}

CustomElement.prototype.setDimensions = function(width, height) {
    this.width = width;
    this.height = height;
    
    this.buffer.width = width;
    this.buffer.height = height;
}

CustomElement.prototype.setOffset = function(offset) {
    this.offset = offset;
}

CustomElement.prototype.copyBuffer = function(buffer, positionX, positionY) {
    this.context.drawImage(buffer, positionX, positionY);
}

CustomElement.prototype.clear = function() {
    this.context.clearRect(0, 0, this.buffer.width, this.buffer.height);
}

CustomElement.prototype.draw = function(context, viewportX, viewportY, rootLocalX, rootLocalY) {
    const localX = rootLocalX + this.position.x;
    const localY = rootLocalY + this.position.y;
    const renderX = localX - viewportX + this.offset.x;
    const renderY = localY - viewportY + this.offset.y;
    const globalAlpha = context.globalAlpha;

    context.globalAlpha = this.opacity;
    context.drawImage(this.buffer, renderX, renderY);
    context.globalAlpha = globalAlpha;

    this.drawChildren(context, viewportX, viewportY, localX, localY);
}
