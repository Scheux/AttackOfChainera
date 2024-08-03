import { isCircleCicleIntersect } from "../../../math/math.js";
import { Button } from "../button.js";

export const ButtonCircle = function() {
    Button.call(this, "ButtonCircle");
    this.radius = 0;
}

ButtonCircle.prototype = Object.create(Button.prototype);
ButtonCircle.prototype.constructor = ButtonCircle;

ButtonCircle.prototype.collides = function(mouseX, mouseY, mouseRange) {
    const collides = isCircleCicleIntersect(this.position.x, this.position.y, this.radius, mouseX, mouseY, mouseRange);
    return collides;
}

ButtonCircle.prototype.drawDebug = function(context) {
    context.save();
    context.beginPath();
    context.globalAlpha = 0.5;
    context.fillStyle = "#ff00ff";
    context.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI);
    context.fill();
    context.restore();
}

ButtonCircle.prototype.setRadius = function(radius) {
    this.radius = radius;
}

ButtonCircle.prototype.draw = function(context, viewportX, viewportY, rootLocalX, rootLocalY) {
    const localX = rootLocalX + this.position.x;
    const localY = rootLocalY + this.position.y;

    this.drawChildren(context, viewportX, viewportY, localX, localY);
}