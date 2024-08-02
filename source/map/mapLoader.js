import { ResourceLoader } from "../resourceLoader.js";
import { GameMap } from "./gameMap.js";

export const MapLoader = function() {
    this.mapTypes = null;
    this.loadedMaps = new Map();
    this.cachedMaps = new Map();
    this.activeMapID = null;
}

MapLoader.prototype.loadMapTypes = function(mapTypes) {
    if(!mapTypes) {
        console.warn(`MapTypes cannot be undefined! Returning...`);
        return;
    }

    this.mapTypes = mapTypes;
}

MapLoader.prototype.setActiveMap = function(mapID) {
    if(!this.loadedMaps.has(mapID)) {
        console.warn(`Map ${mapID} is not loaded! Returning...`);
        return;
    }

    this.activeMapID = mapID;
}

MapLoader.prototype.getActiveMap = function() {
    if(!this.loadedMaps.has(this.activeMapID)) {
        console.warn(`Map ${this.activeMapID} is not loaded! Returning...`);
        return null;
    }

    return this.loadedMaps.get(this.activeMapID);
}

MapLoader.prototype.getActiveMapID = function() {
    return this.activeMapID;
}

MapLoader.prototype.clearActiveMap = function() {
    this.activeMapID = null;
}

MapLoader.prototype.loadMap = async function(mapID) {
    if(!this.mapTypes[mapID]) {
        console.warn(`Map ${mapID} does not exist! Returning...`);
        return;
    }

    if(this.cachedMaps.has(mapID)) {
        const map = this.cachedMaps.get(mapID);

        this.loadedMaps.set(mapID, map);
        this.loadConnectedMaps(map.connections);
        return;
    }

    try {
        const mapData = this.mapTypes[mapID];
        const mapPath = `${mapData.directory}/${mapData.source}`;
        const mapFile = await ResourceLoader.loadJSON(mapPath);
        const gameMap = new GameMap(mapID, mapFile);

        this.loadedMaps.set(mapID, gameMap);
        this.cachedMaps.set(mapID, gameMap);

        this.loadConnectedMaps(mapFile.connections);
    } catch (error) {
        console.error(error, `Error fetching map file! Returning...`);
        return;
    }
}

MapLoader.prototype.loadConnectedMaps = async function(connections) {
    for(const key in connections) {
        const connection = connections[key];

        if(!connection) {
            continue;
        }

        if(!this.mapTypes[connection.id]) {
            console.warn(`Map ${connection.id} does not exist! Returning...`);
            continue;
        }

        if(this.cachedMaps.has(connection.id)) {
            const map = this.cachedMaps.get(connection.id);
            this.loadedMaps.set(connection.id, map);
            continue;
        }

        try {
            const connectedMapData = this.mapTypes[connection.id];
            const connectedMapPath = `${connectedMapData.directory}/${connectedMapData.source}`;
            const connectedMapFile = await ResourceLoader.loadJSON(connectedMapPath);
            const gameMap = new GameMap(connection.id, connectedMapFile);

            this.loadedMaps.set(connection.id, gameMap);
            this.cachedMaps.set(connection.id, gameMap);

        } catch (error) {
            console.error(error, `Error fetching map file! Returning...`);
            return;
        }
    }
}

MapLoader.prototype.unloadMap = function(mapID) {
    if(!this.loadedMaps.has(mapID)) {
        console.warn(`Map ${mapID} is not loaded! Returning...`);
        return;
    }

    this.loadedMaps.delete(mapID);
}

MapLoader.prototype.getLoadedMap = function(mapID) {
    if(!this.loadedMaps.has(mapID)) {
        console.warn(`Map ${mapID} is not loaded! Returning...`);
        return null;
    }

    return this.loadedMaps.get(mapID);
}

MapLoader.prototype.getCachedMap = function(mapID) {
    if(!this.cachedMaps.has(mapID)) {
        console.warn(`Map ${mapID} is not cached! Returning...`);
        return null;
    }

    return this.cachedMaps.get(mapID);
}

MapLoader.prototype.uncacheMap = function(mapID) {
    if(!this.cachedMaps.has(mapID)) {
        console.warn(`Map ${mapID} is not cached! Returning...`);
        return;
    }

    this.cachedMaps.delete(mapID);
}

MapLoader.prototype.clearCache = function() {
    this.cachedMaps.clear();
}

MapLoader.prototype.clearLoadedMaps = function() {
    this.loadedMaps.clear();
}
