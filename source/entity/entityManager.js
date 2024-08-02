import { IDGenerator } from "../idGenerator.js";
import { Entity } from "./entity.js";

export const EntityManager = function() {
    this.entityTypes = null;
    this.IDGenerator = new IDGenerator();
    this.entities = new Map();
}

EntityManager.prototype.update = function(gameContext) {
    for(const [id, entity] of this.entities) {
        entity.update(gameContext);
    }
}

EntityManager.prototype.workStart = function(entityList) {
    this.entities = entityList;
}

EntityManager.prototype.workEnd = function() {
    this.entities.forEach(entity => this.removeEntity(entity.id));
    this.IDGenerator.reset();
}

EntityManager.prototype.loadEntityTypes = function(entityTypes) {
    if(!entityTypes) {
        console.warn(`EntityTypes cannot be undefined! Returning...`);
        return;
    }

    this.entityTypes = entityTypes;
}

EntityManager.prototype.getEntity = function(entityID) {
    if(!this.entities.has(entityID)) {
        console.warn(`Entity ${entityID} does not exist! Returning null...`);
        return null;
    }

    return this.entities.get(entityID);
}

EntityManager.prototype.createEntity = function(entityType) {    
    const config = this.entityTypes[entityType];
    const entityID = this.IDGenerator.getID();
    const entity = new Entity(entityID);

    if(config) {
        entity.setConfig(config);
    }

    this.entities.set(entityID, entity)

    return entity;
}

EntityManager.prototype.removeEntity = function(entityID) {
    if(!this.entities.has(entityID)) {
        console.warn(`Entity ${entityID} does not exist! Returning...`);
        return;
    }

    this.entities.delete(entityID);
}