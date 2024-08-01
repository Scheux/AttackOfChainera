import { Drawable } from "./drawable"

export const Sprite = function() {
    Drawable.call(this);
}

Sprite.prototype = Object.create(Drawable.prototype);
Sprite.prototype.constructor = Drawable;
