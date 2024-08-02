import { Entity } from "../source/entity/entity.js";

export const Sign = function() {
    Entity.call(this);
}

Sign.prototype = Object.create(Entity.prototype);
Sign.prototype.constructor = Sign;