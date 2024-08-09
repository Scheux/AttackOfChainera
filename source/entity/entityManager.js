import { IDGenerator } from "../idGenerator.js";
import { Entity } from "./entity.js";

export const EntityManager = function() {
    this.entityTypes = {};
    this.IDGenerator = new IDGenerator();
    this.entities = new Map();
    this.activeEntities = new Set();
}

EntityManager.prototype.saveEntities = function(gameContext) {
    //saves entities by id in an array
    /*
    [
        { "id", "map", "tileX", "tileY", "spriteType", "objectType" }
    ]
    */
}

EntityManager.prototype.update = function(gameContext) {
    for(const entityID of this.activeEntities) {
        const entity = this.entities.get(entityID);
        entity.update(gameContext);
    }
}

EntityManager.prototype.workEnd = function() {
    this.entities.forEach(entity => this.removeEntity(entity.id));
    this.IDGenerator.reset();
}

EntityManager.prototype.changeEntityState = function(entityID, toActive) {
    if(!this.entities.has(entityID)) {
        console.warn(`Entity ${entityID} does not exist! Returning...`);
        return;
    }

    if(toActive) {
        if(!this.activeEntities.has(entityID)) {
            this.activeEntities.add(entityID);
        }
        return;
    }

    if(this.activeEntities.has(entityID)) {
        this.activeEntities.delete(entityID);
    }
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
    const entity = new Entity(entityID, entityType);

    if(config) {
        entity.setConfig(config);
    } else {
        console.warn(`EntityType ${entityType} does not exist! Using empty config! Proceeding...`);
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