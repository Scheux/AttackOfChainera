import { Vec2 } from "../math/vec2.js";
import { Family } from "./family.js";

export const Drawable = function(DEBUG_NAME) {
    this.id = Symbol();
    this.DEBUG_NAME = DEBUG_NAME;
    this.position = new Vec2(0, 0);
    this.family = null;
    this.isVisible = true;
    this.opacity = 1;
}

Drawable.prototype.draw = function(context, viewportX, viewportY, rootLocalX, rootLocalY) {

}

Drawable.prototype.receiveUpdate = function(timeStamp, timeStep) {
    
}

Drawable.prototype.setPosition = function(positionVector) {
    if(!positionVector) {
        console.warn(`Position of ${this.DEBUG_NAME} cannot be undefined! Returning...`);
        return;
    }

    this.position = positionVector;
}

Drawable.prototype.setPositionRaw = function(positionX, positionY) {
    if(positionX === undefined || positionY === undefined) {
        console.warn(`PositionX or PositionY of ${this.DEBUG_NAME} cannot be undefined! Returning...`);
        return;
    }

    this.position.x = positionX;
    this.position.y = positionY;
}

Drawable.prototype.openFamily = function(customName) {
    if(this.family) {
        console.warn(`Drawable ${this.DEBUG_NAME} already has family ${this.family.customName} open! Cannot create new family! Returning...`);
        return;
    }

    this.family = new Family(this);
    this.family.setCustomName(customName);
}

Drawable.prototype.closeFamily = function() {
    if(!this.family) {
        return;
    }

    this.family.onRemove();
    this.family = null;
}

Drawable.prototype.setVisible = function(visible) {
    if(visible === undefined) {
        console.warn(`IsVisible cannot be undefined! Returning...`);
        return;
    }

    this.isVisible = visible;
}

Drawable.prototype.setOpacity = function(opacity) {
    if(opacity === undefined) {
        console.warn(`Opacity cannot be undefined! Returning...`);
        return;
    }

    this.opacity = opacity;
}

Drawable.prototype.drawChildren = function(context, viewportX, viewportY, rootLocalX, rootLocalY) {
    if(!this.family) {
        return;
    }

    const children = this.family.getAllChildren();

    children.forEach(child => {
        const reference = child.getReference();

        reference.draw(context, viewportX, viewportY, rootLocalX, rootLocalY);
    });
}

Drawable.prototype.addChild = function(drawable, customChildID) {
    if(!this.family) {
        console.warn(`Family of ${this.DEBUG_NAME} is not open! Family has been opened as null! Proceeding...`);
        this.openFamily(null);
    }

    if(!customChildID) {
        console.warn(`customChildID cannot be undefined! Returning...`);
        return;
    }

    if(this.family.getChildByName(customChildID)) {
        console.warn(`Child ${customChildID} already exists on parent ${this.DEBUG_NAME}! Returning...`);
        return;
    }

    drawable.openFamily(customChildID);
    this.family.addChild(drawable.family);
}

Drawable.prototype.removeChild = function(customChildID) {
    if(!this.family) {
        console.warn(`Family of Drawable ${this.DEBUG_NAME} is not open! Returning...`);
        return null;
    }

    if(!this.family.getChildByName(customChildID)) {
        console.warn(`Child ${customChildID} does not exist on parent ${this.DEBUG_NAME}! Returning...`);
        return null;
    }

    const child = this.family.getChildByName(customChildID);
    child.onRemove();

    return child;
}

Drawable.prototype.getID = function() {
    return this.id;
}