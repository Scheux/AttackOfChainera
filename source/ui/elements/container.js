import { UIElement } from "../uiElement.js";

export const Container = function() {
    UIElement.call(this, "Container");
    this.width = 0;
    this.height = 0;
} 

Container.prototype = Object.create(UIElement.prototype);
Container.prototype.constructor = Container;

Container.prototype.setDimensions = function(width, height) {
    this.width = width;
    this.height = height;
}