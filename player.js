import { Move3D } from "./move3D.js";
import { PlayerDefault } from "./playerDefault.js";
import { Position3D } from "./position3D.js";
import { Entity } from "./source/entity/entity.js";

export const Player = function() {
    Entity.call(this, null, "PLAYER");
    this.position3D = new Position3D();
    this.move3D = new Move3D();

    this.states.addState("0", new PlayerDefault());
    this.states.setNextState("0");
}

Player.prototype = Object.create(Entity.prototype);
Player.prototype.constructor = Entity;