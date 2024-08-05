export const MapEditor = function() {
    this.availableBrushSizes = new Map([[MapEditor.BRUSH_SIZE_SMALL, 0], [MapEditor.BRUSH_SIZE_MEDIUM, 1], [MapEditor.BRUSH_SIZE_LARGE, 2], [MapEditor.BRUSH_SIZE_EXTRALARGE, 3], [MapEditor.BRUSH_SIZE_COLOSSAL, 4]]);
    this.brushSize = 0;
    this.availableBrushes = [];
    this.brushColumn = 0;
    this.brushRow = 0;

    this.selectedBrush = null;

    this.tileSets = {};
    this.tileSetKeys = [];
    this.currentSetIndex = 0;

    this.brushModeTypes = ["frames", "patterns", "animations"];
    this.brushModes = [MapEditor.MODE_TYPE_TILE, MapEditor.MODE_TYPE_PATTERN, MapEditor.MODE_TYPE_ANIMATION];
    this.brushModeIndex = 0;

    this.pageElements = [];
    this.pageIndex = 0;
}

MapEditor.MODE_TYPE_TILE = "TILE";
MapEditor.MODE_TYPE_PATTERN = "PATTERN";
MapEditor.MODE_TYPE_ANIMATION = "ANIMATION";
MapEditor.BRUSH_SIZE_SMALL = 0;
MapEditor.BRUSH_SIZE_MEDIUM = 1;
MapEditor.BRUSH_SIZE_LARGE = 2;
MapEditor.BRUSH_SIZE_EXTRALARGE = 3;
MapEditor.BRUSH_SIZE_COLOSSAL = 4;

MapEditor.prototype.selectBrush = function(brush) {
    if(!brush) {
        console.warn(`Brush cannot be undefined! Returning...`);
        return;
    }

    this.selectedBrush = brush;
}

MapEditor.prototype.clearPageElements = function() {
    this.pageElements = [];
    this.pageIndex = 0;
}

MapEditor.prototype.getPageElements = function(availableSlots) {
    const tileSetID = this.getCurrentSetID();
    const brushModeID = this.getBrushModeID();
    const pageElements = []; 

    for(let i = 0; i < availableSlots.length; i++) {
        const index = availableSlots.length * this.pageIndex + i;

        if(!this.pageElements[index]) {
            pageElements.push(null);
            continue;
        }

        pageElements.push([
            tileSetID,
            this.pageElements[index],
            this.brushModes[this.brushModeIndex],
            this.brushModeTypes[this.brushModeIndex]
        ]);
    }

    return pageElements;
}

MapEditor.prototype.reloadPageElements = function() {
    this.clearPageElements();
    const brushMode = this.getBrushModeID();
    const tileSet = this.getCurrentSet();
    
    if(!tileSet || !brushMode) {
        console.warn(`Refreshing PageElements failed! Returning...`);
        return;
    }

    const brushType = this.brushModeTypes[this.brushModeIndex];
    const brushElements = tileSet[brushType];

    for(const key in brushElements) {
        this.pageElements.push(key);
    }
}

MapEditor.prototype.loadTileSets = function(tileSets) {
    this.tileSets = tileSets;
    this.tileSetKeys = Object.keys(tileSets);
}

MapEditor.prototype.getCurrentSet = function() {
    if(!this.tileSetKeys[this.currentSetIndex]) {
        console.warn(`CurrentSetIndex cannot be null! Returning null...`);
        return null;
    }

    return this.tileSets[this.tileSetKeys[this.currentSetIndex]];
}

MapEditor.prototype.getCurrentSetID = function() {
    if(!this.tileSetKeys[this.currentSetIndex]) {
        console.warn(`CurrentSetIndex cannot be null! Returning null...`);
        return null;
    }

    return this.tileSetKeys[this.currentSetIndex];
}

MapEditor.prototype.getBrushModeID = function() {
    if(!this.brushModes[this.brushModeIndex]) {
        console.warn(`BrushModeIndex cannot be null! Returning null...`);
        return null;
    }

    return this.brushModes[this.brushModeIndex];
}

MapEditor.prototype.setBrushSize = function(brushSize) {
    if(!this.availableBrushSizes.has(brushSize)) {
        console.warn(`BrushSize ${brushSize} does not exist! Returning...`);
        return;
    }

    this.brushSize = this.availableBrushSizes.get(brushSize);
}

MapEditor.prototype.scrollPage = function(availableButtonSlots) {
    const maxElementsPossibleSoFar = (this.pageIndex + 1) * availableButtonSlots.length;
    const continuesOnNextPage = this.pageElements.length > maxElementsPossibleSoFar;
    const index = continuesOnNextPage ? this.pageIndex + 1 : 0;

    if(index === this.pageIndex) {
        return;
    }
    //TODO: ONLY SCROLLS FORWARD. ALLOW BACKWARD - LOW PRIORITY
    this.pageIndex = index;
}

MapEditor.prototype.scrollBrushMode = function(value) {
    this.brushModeIndex += value;

    if(this.brushModeIndex > this.brushModes.length - 1) {
        this.brushModeIndex = 0;
    } else if(this.brushModeIndex < 0) {
        this.brushModeIndex = this.brushModes.length - 1;
    }

    this.pageIndex = 0;
}

MapEditor.prototype.scrollCurrentSet = function(value) {
    this.currentSetIndex += value;

    if(this.currentSetIndex > this.tileSetKeys.length - 1) {
        this.currentSetIndex = 0;
    } else if(this.currentSetIndex < 0) {
        this.currentSetIndex = this.tileSetKeys.length - 1;
    }

    this.pageIndex = 0;
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
}

MapEditor.prototype.scrollBrushSize = function(value) {
    this.brushSize += value;

    if(this.brushSize > this.availableBrushSizes.size - 1) {
        this.brushSize = 0;
    } else if(this.brushSize < 0) {
        this.brushSize = this.availableBrushSizes.size - 1;
    }
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

MapEditor.prototype.saveMap = function(gameMap) {
    if(!gameMap) {
        console.warn(`No GameMap given! Returning...`);
        return `{ "ERROR": "NO_MAP_CACHED! USE CREATE!" }`;
    }

    const stringify2DArray = array => {
        const rows = array.map(row => JSON.stringify(row));
        return `[
            ${rows.join(`,
            `)}
        ]`;
    }

    const {
        music,
        width,
        height,
        layers,
        tiles,
        connections,
        entities,
        flags
    } = gameMap;

    return `{
    "music": ${music},
    "width": ${width},
    "height": ${height},
    "layers": {
        "collision": ${stringify2DArray(layers["collision"])},
        "bottom": ${stringify2DArray(layers["bottom"])},
        "floor": ${stringify2DArray(layers["floor"])},
        "top": ${stringify2DArray(layers["top"])}
    },
    "connections": {},
    "entities" : [],
    "flags" : {}
}`;
}