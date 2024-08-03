import { UIElement } from "./uiElement.js";

export const Button = function(DEBUG_NAME) {
    UIElement.call(this, DEBUG_NAME);
    this.sprite = null;
}

Button.prototype = Object.create(UIElement.prototype);
Button.prototype.constructor = Button;

Button.prototype.setSprite = function(sprite) {
    this.sprite = sprite;
}