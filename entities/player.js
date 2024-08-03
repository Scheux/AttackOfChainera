import { Entity } from "../source/entity/entity.js";

export const Player = function() {
    Entity.call(this);
}

Player.prototype = Object.create(Entity.prototype);
Player.prototype.constructor = Player;