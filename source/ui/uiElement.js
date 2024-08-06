import { Drawable } from "../graphics/drawable.js";
import { EventEmitter } from "../events/eventEmitter.js";

export const UIElement = function(DEBUG_NAME) {
    Drawable.call(this, DEBUG_NAME);

    this.width = 0;
    this.height = 0;
    this.config = null;
    this.goals = new Map();
    this.goalsReached = new Set();
    
    this.events = new EventEmitter();
    this.events.listen(UIElement.EVENT_CLICKED);
    this.events.listen(UIElement.EVENT_DRAW);
    this.events.listen(UIElement.EVENT_DEBUG);
    this.events.listen(UIElement.EVENT_COLLIDES);
}

UIElement.ANCHOR_TYPE_TOP_CENTER = "TOP_CENTER";
UIElement.ANCHOR_TYPE_TOP_LEFT = "TOP_LEFT";
UIElement.ANCHOR_TYPE_TOP_RIGHT = "TOP_RIGHT";
UIElement.ANCHOR_TYPE_BOTTOM_CENTER = "BOTTOM_CENTER";
UIElement.ANCHOR_TYPE_BOTTOM_LEFT = "BOTTOM_LEFT";
UIElement.ANCHOR_TYPE_BOTTOM_RIGHT = "BOTTOM_RIGHT";
UIElement.ANCHOR_TYPE_RIGHT_CENTER = "RIGHT_CENTER";
UIElement.ANCHOR_TYPE_LEFT_CENTER = "LEFT_CENTER";
UIElement.ANCHOR_TYPE_CENTER = "CENTER";

UIElement.EVENT_CLICKED = 0;
UIElement.EVENT_DRAW = 1;
UIElement.EVENT_DEBUG = 2;
UIElement.EVENT_COLLIDES = 3;

UIElement.prototype = Object.create(Drawable.prototype);
UIElement.prototype.constructor = UIElement;

UIElement.prototype.fetch = function(element) {

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

        case UIElement.ANCHOR_TYPE_TOP_CENTER: {
            this.position.x = viewportWidth / 2 - this.config.position.x - this.width / 2;
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
        
        case UIElement.ANCHOR_TYPE_BOTTOM_CENTER: {
            this.position.x = viewportWidth / 2 - this.config.position.x - this.width / 2;
            this.position.y = viewportHeight - this.config.position.y - this.height;
            break;
        }

        case UIElement.ANCHOR_TYPE_BOTTOM_RIGHT: {
            this.position.x = viewportWidth - this.config.position.x - this.width;
            this.position.y = viewportHeight - this.config.position.y - this.height;
            break;
        }

        case UIElement.ANCHOR_TYPE_LEFT_CENTER: {
            this.position.y = viewportHeight / 2 - this.config.position.y - this.height / 2;
            break;
        }

        case UIElement.ANCHOR_TYPE_CENTER: {
            this.position.x = viewportWidth / 2 - this.config.position.x - this.width / 2;
            this.position.y = viewportHeight / 2 - this.config.position.y - this.height / 2;
            break;
        }

        case UIElement.ANCHOR_TYPE_RIGHT_CENTER: {
            this.position.x = viewportWidth - this.config.position.x - this.width;
            this.position.y = viewportHeight / 2 - this.config.position.y - this.height / 2;
            break;
        }

        default: {
            console.warn(`AnchorType ${this.anchor} does not exist! Returning...`);
            return null;
        }
    }
}

UIElement.prototype.collides = function(mouseX, mouseY, mouseRange) {
    return false;
}

UIElement.prototype.handleCollision = function(mouseX, mouseY, mouseRange, collidedElements) {
    const localX = mouseX - this.position.x;
    const localY = mouseY - this.position.y;

    collidedElements.push(this);

    if(!this.family || this.family.children.length === 0) {
        return;
    }

    const children = this.family.getAllChildren();

    for(const childFamily of children) {
        const child = childFamily.reference;
        const isColliding = child.collides(localX, localY, mouseRange);

        if(!isColliding) {
            continue;
        }

        child.handleCollision(localX, localY, mouseRange, collidedElements);
    }
}

UIElement.prototype.drawDebug = function(context, viewportX, viewportY, rootLocalX, rootLocalY) {
    const localX = rootLocalX + this.position.x;
    const localY = rootLocalY + this.position.y;

    this.events.emit(UIElement.EVENT_DEBUG, context, localX, localY);

    if(!this.family) {
        return;
    }

    const children = this.family.getAllChildren();

    children.forEach(child => {
        const reference = child.getReference();

        reference.drawDebug(context, viewportX, viewportY, localX, localY);
    });
}

UIElement.prototype.postDraw = function(context, localX, localY) {

}

UIElement.prototype.draw = function(context, viewportX, viewportY, rootLocalX, rootLocalY) {
    const localX = rootLocalX + this.position.x;
    const localY = rootLocalY + this.position.y;

    this.events.emit(UIElement.EVENT_DRAW, context, localX, localY);
    this.postDraw(context, localX, localY);
    this.drawChildren(context, viewportX, viewportY, localX, localY);
}

UIElement.prototype.setDimensions = function(width = 0, height = 0) {
    this.width = width;
    this.height = height;
}