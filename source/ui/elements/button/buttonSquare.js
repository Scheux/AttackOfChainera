import { rectangularCollision } from "../../../math/math.js";
import { UIElement } from "../../uiElement.js";
import { Button } from "../button.js";

export const ButtonSquare = function() {
    Button.call(this, "BUTTON_SQUARE");

    this.events.subscribe(UIElement.EVENT_DEBUG, "BUTTON_SQUARE", (context, localX, localY) => {
        context.save();
        context.globalAlpha = 0.2;
        context.fillStyle = "#ff00ff";
        context.fillRect(localX, localY, this.width, this.height);
        context.restore();
    });
}

ButtonSquare.prototype = Object.create(Button.prototype);
ButtonSquare.prototype.constructor = ButtonSquare;

ButtonSquare.prototype.collides = function(mouseX, mouseY, mouseRange) {
    const collision = rectangularCollision(this.position.x, this.position.y, this.width, this.height, mouseX, mouseY, mouseRange, mouseRange);
    return collision;
}

ButtonSquare.prototype.postDraw = function(context, localX, localY) {
    if(this.isHighlighted) {
        context.save();
        context.globalAlpha = this.highlightOpacity;
        context.fillStyle = this.highlightColor;
        context.fillRect(localX, localY, this.width, this.height);
        context.restore();
        this.isHighlighted = false;
    }
}