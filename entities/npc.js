import { Entity } from "../source/entity/entity.js";

export const NPC = function() {
    Entity.call(this);
}

NPC.prototype = Object.create(Entity.prototype);
NPC.prototype.constructor = NPC;