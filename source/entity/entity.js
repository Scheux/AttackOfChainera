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
}

Entity.prototype.update = function(gameContext) {
    this.states.update(gameContext);
}

Entity.prototype.setConfig = function(config) {
    if(config) {
        this.config = config;
    }
} 