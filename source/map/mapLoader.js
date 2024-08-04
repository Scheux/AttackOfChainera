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
        //console.warn(`Map ${this.activeMapID} is not loaded! Returning...`);
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
    if(this.cachedMaps.has(mapID)) {
        const map = this.cachedMaps.get(mapID);

        this.loadedMaps.set(mapID, map);
        this.loadConnectedMaps(map.connections);
        return;
    }

    if(!this.mapTypes[mapID]) {
        console.warn(`Map ${mapID} does not exist! Returning...`);
        return;
    }

    try {
        const mapData = this.mapTypes[mapID];
        const mapPath = `${mapData.directory}/${mapData.source}`;
        const mapFile = await ResourceLoader.loadJSON(mapPath);
        const gameMap = new GameMap(mapID, mapFile);

        this.loadedMaps.set(mapID, gameMap);
        this.cachedMaps.set(mapID, gameMap);

        await this.loadConnectedMaps(mapFile.connections);
    } catch (error) {
        console.error(error, `Error fetching map file! Returning...`);
        return;
    }

    this.loadMapConnections(mapID);
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

MapLoader.prototype.loadMapConnections = function(mapID) {
    if(!this.loadedMaps.has(mapID)) {
        console.warn(`Map ${mapID} is not loaded! Returning...`);
        return;
    }

    const connections = [];
    const gameMap = this.getLoadedMap(mapID);

    if(!gameMap.connections) {
        gameMap.connections = connections;
        return;
    }

    for(const key in gameMap.connections) {
        const connection = gameMap.connections[key];
        
        if(!connection) {
            continue;
        }

        switch(connection.type) {
            case "north": {
                const connectedMap = this.getLoadedMap(connection.id);
                connection.startX = connection.scroll;
                connection.startY = -connectedMap.height;
                connection.endX = connectedMap.width + connection.scroll;
                connection.endY = 0;
                connection.attachX = connection.scroll;
                connection.attachY = 0;
                connection.height = connectedMap.height;
                connection.width = connectedMap.width;
                connections.push(connection);
                break;
            }
            case "south": {
                const connectedMap = this.getLoadedMap(connection.id);
                connection.startX = connection.scroll;
                connection.startY = gameMap.height;
                connection.endX = connectedMap.width + connection.scroll;
                connection.endY = gameMap.height + connectedMap.height;
                connection.attachX = connection.scroll;
                connection.attachY = gameMap.height;
                connection.height = connectedMap.height;
                connection.width = connectedMap.width;
                connections.push(connection);
                break;
            }
            case "east": {
                const connectedMap = this.getLoadedMap(connection.id);
                connection.startX = gameMap.width;
                connection.startY = connection.scroll;
                connection.endX = gameMap.width + connectedMap.width;
                connection.endY = connection.scroll + connectedMap.height;
                connection.attachX = gameMap.width;
                connection.attachY = connection.scroll;
                connection.height = connectedMap.height;
                connection.width = connectedMap.width;
                connections.push(connection);
                break;
            }
            case "west": {
                const connectedMap = this.getLoadedMap(connection.id);
                connection.startX = -connectedMap.width;
                connection.startY = connection.scroll;
                connection.endX = 0;
                connection.endY = connectedMap.height + connection.scroll;
                connection.attachX = 0;
                connection.attachY = connection.scroll;
                connection.height = connectedMap.height;
                connection.width = connectedMap.width;
                connections.push(connection);
                break;
            }
        }
    }

    gameMap.connections = connections;
}

MapLoader.prototype.unloadMap = function(mapID) {
    if(!this.loadedMaps.has(mapID)) {
        console.warn(`Map ${mapID} is not loaded! Returning...`);
        return;
    }

    if(this.activeMapID === mapID) {
        this.activeMapID = null;
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

MapLoader.prototype.cacheMap = function(map) {
    if(!map) {
        console.warn(`Map cannot be undefined! Returning...`);
        return; 
    }

    if(this.cachedMaps.has(map.id)) {
        console.warn(`Map ${map.id} is already cached! Returning...`);
        return;
    }

    this.cachedMaps.set(map.id, map);
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

MapLoader.prototype.createEmptyMap = function(id, width, height) {
    const config = {
        "width": width,
        "height": height,
        "music": null,
        "layers": {},
        "tiles": [],
        "connections": [],
        "entities": [],
        "flags": {}
    }

    const gameMap = new GameMap(id, config);

    gameMap.generateEmptyLayer("collision");
    gameMap.generateEmptyLayer("bottom");
    gameMap.generateEmptyLayer("floor");
    gameMap.generateEmptyLayer("top");

    return gameMap;
}

MapLoader.prototype.saveMap = function(mapID) {
    if(!mapID) {
        console.warn(`No mapID given. Proceeding with activeMap ${this.activeMap}`);
        mapID = this.getActiveMap();
    }

    if(!this.loadedMaps.has(mapID)) {
        console.warn(`Map (${mapID}) does not exist!`);
        return null;
    }

    const csvList = [];
    const tileList = [];
    const { width, height, music, tiles, entities } = this.getMap(mapID);
    const config = {
        "id": mapID,
        "width": width,
        "height": height,
        "music": music,
        "friendlyTiles": [],
        "entities": [],
        "time": Date.now()
    };

    for(let i = 0; i < height; i++) {
        if(!tiles[i]) {
            continue;
        }

        tileList[i] = [];
        csvList[i] = [];

        for(let j = 0; j < width; j++) {
            if(!tiles[i][j]) {
                continue;
            }

            csvList[i][j] = tiles[i][j].config.offlineID;;
            tileList[i][j] = tiles[i][j].config.id;

            if(tiles[i][j].isFriendly) {
                config.friendlyTiles.push({"X": j, "Y": i});
            }
        }
    }

    entities.forEach(entity => {
        const saveData = {};
        const components = entity.components.save();

        saveData["type"] = entity.config.id;
        saveData["components"] = components;
        
        config.entities.push(saveData);
    });

    return { config, tileList, csvList };
}