export const MapEditor = function() {
    this.availableBrushSizes = new Map([[MapEditor.BRUSH_SIZE_SMALL, 0], [MapEditor.BRUSH_SIZE_MEDIUM, 1], [MapEditor.BRUSH_SIZE_LARGE, 2], [MapEditor.BRUSH_SIZE_EXTRALARGE, 3], [MapEditor.BRUSH_SIZE_COLOSSAL, 4]]);
    this.brushSize = 0;
    this.availableBrushes = [];
    this.brushColumn = 0;
    this.brushRow = 0;
}

MapEditor.BRUSH_SIZE_SMALL = 0;
MapEditor.BRUSH_SIZE_MEDIUM = 1;
MapEditor.BRUSH_SIZE_LARGE = 2;
MapEditor.BRUSH_SIZE_EXTRALARGE = 3;
MapEditor.BRUSH_SIZE_COLOSSAL = 4;

MapEditor.prototype.setBrushSize = function(brushSize) {
    if(!this.availableBrushSizes.has(brushSize)) {
        return;
    }

    this.brushSize = this.availableBrushSizes.get(brushSize);
}

MapEditor.prototype.setAvailableBrushes = function(brushes) {
    this.availableBrushes = brushes;
}

MapEditor.prototype.scrollBrushes = function(horizontal, vertical) {
    this.brushColumn += horizontal;

    if(horizontal !== 0) {
        this.brushRow = 0;
    }

    if(this.brushColumn > this.availableBrushes.length - 1) {
        this.brushColumn = 0;
    } else if(this.brushColumn < 0) {
        this.brushColumn = this.availableBrushes.length - 1;
    }

    this.brushRow += vertical;

    if(this.brushRow > this.availableBrushes[this.brushColumn].length - 1){
        this.brushRow = 0;
    } else if(this.brushRow < 0) {
        this.brushRow = this.availableBrushes[this.brushColumn].length - 1;
    }

    console.log(this.getBrush());
}

MapEditor.prototype.getBrush = function() {
    const brushColumn = this.availableBrushes[this.brushColumn];

    if(!brushColumn) {
        return null;
    }

    const brushRow = brushColumn[this.brushRow];

    return brushRow;
}

MapEditor.prototype.getBrushSize = function() {
    return this.availableBrushSizes.get(this.brushSize);
}

MapEditor.prototype.paint = function(gameContext, tileVector) {
    const { level } = gameContext;
    const { tileManager } = level;

    const brush = this.getBrush();

    if(!brush) {
        return;
    }

    const brushSize = this.getBrushSize();
    const tilesToPaint = tileManager.getTilesInRange(tileVector, brushSize, brushSize);

    tilesToPaint.forEach(tile => tileManager.updateTileConfig(tile, brush));
    tileManager.emitUpdateEvents(tileVector.x, tileVector.y, brushSize + 1, brushSize + 1);
}

MapEditor.prototype.brushProperty = function(gameContext, tileVector, property, value) {
    const { level } = gameContext;
    const { tileManager } = level;

    const brushSize = this.getBrushSize();
    const tilesToEdit = tileManager.getTilesInRange(tileVector, brushSize, brushSize);
    
    tilesToEdit.forEach(tile => tile[property] = value);
    tileManager.emitUpdateEvents(tileVector.x, tileVector.y, brushSize + 1, brushSize + 1);
}

MapEditor.prototype.scrollBrushSize = function(value) {
    this.brushSize += value;

    if(this.brushSize > this.availableBrushSizes.size - 1) {
        this.brushSize = 0;
    } else if(this.brushSize < 0) {
        this.brushSize = this.availableBrushSizes.size - 1;
    }
}

MapEditor.prototype.saveMap = function(mapID) {
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