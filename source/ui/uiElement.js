import { Drawable } from "../graphics/drawable.js";
import { EventEmitter } from "../events/eventEmitter.js";

export const UIElement = function(DEBUG_NAME) {
    Drawable.call(this, DEBUG_NAME);

    this.config = null;
    this.goals = new Map();
    this.goalsReached = new Set();
    
    this.events = new EventEmitter();
    this.events.listen(UIElement.EVENT_CLICKED);
    this.events.listen(UIElement.EVENT_HOVER);
}

UIElement.ANCHOR_TYPE_TOP_LEFT = "TOP_LEFT";
UIElement.ANCHOR_TYPE_TOP_RIGHT = "TOP_RIGHT";
UIElement.ANCHOR_TYPE_BOTTOM_LEFT = "BOTTOM_LEFT";
UIElement.ANCHOR_TYPE_BOTTOM_RIGHT = "BOTTOM_RIGHT";
UIElement.EVENT_CLICKED = 0;
UIElement.EVENT_HOVER = 1;

UIElement.prototype = Object.create(Drawable.prototype);
UIElement.prototype.constructor = UIElement;

UIElement.prototype.fetch = function(element) {

}

UIElement.prototype.drawDebug = function(context) {

}

UIElement.prototype.collides = function(mouseX, mouseY, mouseRange) {

}

UIElement.prototype.allGoalsReached = function() {
    return this.goalCount === 0;
}

UIElement.prototype.setConfig = function(config) {
    if(!config) {
        console.warn(`Config cannot be undefined! Returning...`);
        return;
    }

    this.config = config;
}

UIElement.prototype.adjustAnchor = function(viewportWidth, viewportHeight) {
    if(!this.config.anchor) {
        return;
    }

    switch(this.config.anchor) {
        case UIElement.ANCHOR_TYPE_TOP_LEFT: {
            break;
        }

        case UIElement.ANCHOR_TYPE_TOP_RIGHT: {
            this.position.x = viewportWidth - this.config.position.x - this.width;
            break;
        }

        case UIElement.ANCHOR_TYPE_BOTTOM_LEFT: {
            this.position.y = viewportHeight - this.config.position.y - this.height;
            break;
        }

        case UIElement.ANCHOR_TYPE_BOTTOM_RIGHT: {
            this.position.x = viewportWidth - this.config.position.x - this.width;
            this.position.y = viewportHeight - this.config.position.y - this.height;
            break;
        }

        default: {
            console.warn(`AnchorType ${this.anchor} does not exist! Returning...`);
            return null;
        }
    }
}