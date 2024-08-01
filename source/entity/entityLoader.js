import { IDGenerator } from "../idGenerator.js";
import { Entity } from "./entity.js";

export const EntityLoader = function(entityTypes) {
    this.entityTypes = entityTypes;
    this.IDGenerator = new IDGenerator();
    this.entities = new Map();
}

EntityLoader.prototype.workOn = function(entityList) {
    this.entities = entityList;
    this.IDGenerator.reset();
}

EntityLoader.prototype.createEntity = function(entityType) {    
    const config = this.entityTypes[entityType];
    const id = this.IDGenerator.getID();
    const entity = new Entity(id);

    if(config) {
        entity.setConfig(config);
    }

    this.entities.set(id, entity)

    return entity;
}

EntityLoader.prototype.removeEntity = function(entityID) {
    if(!this.entities.has(entityID)) {
        return;
    }

    this.entities.delete(entityID);
}