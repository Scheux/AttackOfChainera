import { EventEmitter } from "../events/eventEmitter.js";
import { StateMachine } from "../state/stateMachine.js";

export const Entity = function(id, DEBUG_NAME) {
    this.id = id;
    this.DEBUG_NAME = DEBUG_NAME;
    this.config = {};

    this.states = new StateMachine(this);
    this.events = new EventEmitter();
    this.events.listen(Entity.EVENT_HIT);
}

Entity.EVENT_HIT = 0;

Entity.prototype.update = function(gameContext) {
    this.states.update(gameContext);
}

Entity.prototype.setConfig = function(config) {
    if(config) {
        this.config = config;
    }
} 