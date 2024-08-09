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
    this.events.listen(Entity.EVENT_DIRECTION_UPDATE);
    this.events.listen(Entity.EVENT_SPRITE_UPDATE);
    this.events.listen(Entity.EVENT_TARGET_REACHED);
}

Entity.EVENT_POSITION_UPDATE = "EVENT_POSITION_UPDATE";
Entity.EVENT_TRANSITION_MAP = "EVENT_TRANSITION_MAP"; 
Entity.EVENT_DIRECTION_UPDATE = "EVENT_DIRECTION_UPDATE";
Entity.EVENT_SPRITE_UPDATE = "EVENT_SPRITE_UPDATE";
Entity.EVENT_TARGET_REACHED = "EVENT_TARGET_REACHED";

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