import { EventEmitter } from "../events/eventEmitter.js";
import { StateMachine } from "../state/stateMachine.js";

export const Entity = function(id) {
    this.id = id;
    this.config = {};
    this.states = new StateMachine();
    this.events = new EventEmitter();
    this.events.listen(Entity.EVENT_HIT);
}

Entity.prototype.setConfig = function(config) {
    if(config) {
        this.config = config;
    }
} 

Entity.EVENT_HIT = 0;