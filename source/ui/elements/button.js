import { UIElement } from "../uiElement.js";

export const Button = function(DEBUG_NAME) {
    UIElement.call(this, DEBUG_NAME);
    this.sprite = null;
    this.isHighlighted = false;
    this.highlightColor = "#eeeeee";
    this.highlightOpacity = 0.2;

    this.events.subscribe(UIElement.EVENT_COLLIDES, DEBUG_NAME, () => this.isHighlighted = true);
}

Button.prototype = Object.create(UIElement.prototype);
Button.prototype.constructor = Button;

Button.prototype.setSprite = function(sprite) {
    this.sprite = sprite;
}