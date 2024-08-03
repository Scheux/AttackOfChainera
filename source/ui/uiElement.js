import { Drawable } from "../graphics/drawable.js";
import { EventEmitter } from "../events/eventEmitter.js";

export const UIElement = function(DEBUG_NAME) {
    Drawable.call(this, DEBUG_NAME);

    this.relativeX = null;
    this.relativeY = null;
    this.goals = new Map();
    this.goalsReached = new Set();
    
    this.events = new EventEmitter();
    this.events.listen(UIElement.CLICKED);
    this.events.listen(UIElement.HOVER);
}

UIElement.CLICKED = 0;
UIElement.HOVER = 1;

UIElement.prototype = Object.create(Drawable.prototype);
UIElement.prototype.constructor = UIElement;

UIElement.prototype.onDraw = function(element) {}

UIElement.prototype.drawDebug = function(context) {}

UIElement.prototype.collides = function(mouseX, mouseY, mouseRange) {}

UIElement.prototype.setRelativePosition = function(relativePercentX, relativePercentY, viewportWidth, viewportHeight) {
    const positionX = Math.floor(viewportWidth * (relativePercentX / 100));
    const positionY = Math.floor(viewportHeight * (relativePercentY / 100));

    this.relativeX = relativePercentX;
    this.relativeY = relativePercentY;
    this.position.x = positionX;
    this.position.y = positionY;
}

UIElement.prototype.allGoalsReached = function() {
    return this.goalCount === 0;
}