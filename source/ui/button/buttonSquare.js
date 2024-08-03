import { rectangularCollision } from "../../math/math.js";
import { Button } from "../button.js";

export const ButtonSquare = function() {
    Button.call(this, "ButtonSquare");
    this.width = 0;
    this.height = 0;
}

ButtonSquare.prototype = Object.create(Button.prototype);
ButtonSquare.prototype.constructor = ButtonSquare;

ButtonSquare.prototype.collides = function(mouseX, mouseY, mouseRange) {
    const collision = rectangularCollision(this.position.x, this.position.y, this.width, this.height, mouseX, mouseY, mouseRange, mouseRange);
    return collision;
}

ButtonSquare.prototype.drawDebug = function(context) {
    context.save();
    context.globalAlpha = 0.5;
    context.fillStyle = "#ff00ff";
    context.fillRect(this.position.x, this.position.y, this.width, this.height);
    context.restore();
}

ButtonSquare.prototype.draw = function(context, viewportX, viewportY, rootLocalX, rootLocalY) {
    const localX = rootLocalX + this.position.x;
    const localY = rootLocalY + this.position.y;

    this.drawChildren(context, viewportX, viewportY, localX, localY);
}

ButtonSquare.prototype.setSize = function(width, height) {
    this.width = width;
    this.height = height;
}