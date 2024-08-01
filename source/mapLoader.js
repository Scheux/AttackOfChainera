export const MapLoader = function(mapConfigs) {
    this.mapConfigs = mapConfigs;
    this.loadedMaps = new Map();
    this.activeMapID = null;
}

MapLoader.prototype.getActiveMap = function() {
    if(!this.loadedMaps.has(this.activeMapID)) {
        return null;
    }

    return this.loadedMaps.get(this.activeMapID);
}

MapLoader.prototype.loadMap = function(mapID) {
    if(!this.mapConfigs[mapID]) {
        return;
    }

    this.loadedMaps.set(mapID, this.mapConfigs[mapID]);
}

MapLoader.prototype.setActiveMap = function(mapID) {
    if(!this.loadedMaps.has(mapID)) {
        return;
    }

    this.activeMapID = mapID;
}