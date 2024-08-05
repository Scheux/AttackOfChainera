import { isCircleCicleIntersect } from "../../../math/math.js";
import { UIElement } from "../../uiElement.js";
import { Button } from "../button.js";

export const ButtonCircle = function() {
    Button.call(this, "BUTTON_CIRCLE");
    this.radius = 0;

    this.events.subscribe(UIElement.EVENT_DEBUG, "BUTTON_CIRCLE", (context, localX, localY) => {
        context.save();
        context.beginPath();
        context.globalAlpha = 0.5;
        context.fillStyle = "#ff00ff";
        context.arc(localX, localY, this.radius, 0, 2 * Math.PI);
        context.fill();
        context.restore();
    });
}

ButtonCircle.prototype = Object.create(Button.prototype);
ButtonCircle.prototype.constructor = ButtonCircle;

ButtonCircle.prototype.collides = function(mouseX, mouseY, mouseRange) {
    const collides = isCircleCicleIntersect(this.position.x, this.position.y, this.radius, mouseX, mouseY, mouseRange);
    return collides;
}

ButtonCircle.prototype.setRadius = function(radius) {
    this.radius = radius;
}

ButtonCircle.prototype.postDraw = function(context, localX, localY) {
    if(this.isHighlighted) {
        context.save();
        context.globalAlpha = this.highlightOpacity;
        context.fillStyle = this.highlightColor;
        context.arc(localX, localY, this.radius, 0, 2 * Math.PI);
        context.fill();
        context.restore();
        this.isHighlighted = false;
    }
}

