import { Entity } from "../source/entity/entity.js";

export const Monster = function() {
    Entity.call(this);
}

Monster.prototype = Object.create(Entity.prototype);
Monster.prototype.constructor = Entity;