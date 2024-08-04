import { rectangularCollision } from "../../math/math.js";
import { UIElement } from "../uiElement.js";

export const Container = function() {
    UIElement.call(this, "CONTAINER");
    this.width = 0;
    this.height = 0;

    this.events.subscribe(UIElement.EVENT_DEBUG, "CONTAINER", (context, localX, localY) => {
        context.save();
        context.globalAlpha = 0.2;
        context.fillStyle = "#ff00ff";
        context.fillRect(localX, localY, this.width, this.height);
        context.restore();
    });

} 

Container.prototype = Object.create(UIElement.prototype);
Container.prototype.constructor = Container;

Container.prototype.setDimensions = function(width = 0, height = 0) {
    this.width = width;
    this.height = height;
}

Container.prototype.collides = function(mouseX, mouseY, mouseRange) {
    const collision = rectangularCollision(this.position.x, this.position.y, this.width, this.height, mouseX, mouseY, mouseRange, mouseRange);
    return collision;
}