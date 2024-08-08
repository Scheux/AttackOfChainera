import { ComponentLoader } from "./componentLoader.js";
import { EventEmitter } from "../events/eventEmitter.js";
import { StateMachine } from "../state/stateMachine.js";

export const Entity = function(id, DEBUG_NAME) {
    this.id = id;
    this.DEBUG_NAME = DEBUG_NAME;
    this.config = {};

    this.components = new ComponentLoader();
    this.states = new StateMachine(this);

    this.events = new EventEmitter();
    this.events.listen(Entity.EVENT_POSITION_UPDATE);
    this.events.listen(Entity.EVENT_TRANSITION_MAP);
}

Entity.EVENT_POSITION_UPDATE = 0;
Entity.EVENT_TRANSITION_MAP = 1; 

Entity.prototype.update = function(gameContext) {
    this.states.update(gameContext);
}

Entity.prototype.setConfig = function(config) {
    if(config) {
        this.config = config;
    }
} 

Entity.prototype.getConfig = function() {
    return this.config;
}

Entity.prototype.getID = function() {
    return this.id;
}