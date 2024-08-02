import { ImageBuffer } from "../graphics/imageBuffer.js";
import { normalizeAngle, toAngle, toRadian } from "../helpers.js";
import { ResourceLoader } from "../resourceLoader.js";
import { Camera } from "./camera.js";
import { Canvas } from "./canvas.js";

export const Raycaster = function() {
    this.fov = 60;
    this.positionX = 500;
    this.positionY = 500;
    this.positionZ = 32;
    this.rotation = 90;
    this.pitch = 0;

    this.rayAngles = [];
    this.fishEyeFixes = [];
    this.inverseFishEyeFixes = [];
    this.bytesPerPixel = 4;

    this.halfCameraFov = toRadian(this.fov/2);
    this.halfCameraFovTan = Math.tan(this.halfCameraFov);
    this.distanceToPlane = 1;

    this.width = 0;
    this.height = 0;
    this.PROJECTION_WIDTH = 0;
    this.PROJECTION_HEIGHT = 0;

    this.pitchOffset = 0;
    this.skybox = null;

    this.display = new Canvas().createNewElement(1, 1).getImageData();
    ResourceLoader.promiseImage("assets/sky.png").then(image => this.skybox = new ImageBuffer(image));
}

Raycaster.prototype.calculateRayData = function() {
    this.rayAngles = [];
    this.fishEyeFixes = [];
    this.inverseFishEyeFixes = [];

    for(let i = 0; i < this.width; i++) {
        const screenX = (2 * i) / this.width - 1;
        const rayAngle = Math.atan(screenX * this.halfCameraFovTan);
        const fishEyeFix = Math.cos(rayAngle);
        const inverseFishEyeFix = 1 / fishEyeFix;

        this.rayAngles.push(rayAngle);
        this.fishEyeFixes.push(fishEyeFix);
        this.inverseFishEyeFixes.push(inverseFishEyeFix);
    }

    this.distanceToPlane = (this.width / 2) / this.halfCameraFovTan;
}

Raycaster.prototype.copyPosition = function(position3D) {
    this.positionX = position3D.positionX;
    this.positionY = position3D.positionY;
    this.positionZ = position3D.positionZ;
    this.rotation = position3D.rotation;
    this.pitch = position3D.pitch;
    this.pitchOffset = Math.tan(toRadian(this.pitch)) * this.distanceToPlane;
}

Raycaster.prototype.copyScreen = function() {
    this.width = Math.floor(this.display.width);
    this.height = Math.floor(this.display.height);
    this.PROJECTION_WIDTH = Math.floor(this.display.centerX);
    this.PROJECTION_HEIGHT = Math.floor(this.display.centerY);
}

Raycaster.prototype.raycast = function(gameContext, graphics) {
    const { mapLoader, renderer } = gameContext;
    const gameMap = mapLoader.getActiveMap();

    if(!gameMap) {
        return;
    }

    const cameraAngle = toRadian(this.rotation);

    for(let rayIndex = 0; rayIndex < this.rayAngles.length; rayIndex++) {
        const rayAngle = this.rayAngles[rayIndex];
        const correctedRayAngle = cameraAngle + rayAngle;
    
        const rayIntersections = this.checkRayIntersections(toAngle(correctedRayAngle), gameMap)
        const rayIntersectionsArraySorted = rayIntersections.sort((a, b) => b.distance - a.distance);

        this.drawRays(rayIntersectionsArraySorted, rayIndex, gameMap, correctedRayAngle, graphics, renderer.buffer);
    }   

    this.display.context.putImageData(this.display.imageData, 0, 0);
}

Raycaster.prototype.checkRayIntersections = function(rayAngle, gameMap) {
    const mapWidth = gameMap.width;
    const mapHeight = gameMap.height;
    const visualMap = gameMap.layers["floor"];
    const interactiveMap = gameMap.layers["collision"];

    rayAngle = rayAngle % 360;
    
    if (rayAngle < 0) {
        rayAngle += 360;
    }

    const rayHits = [];
    const tanRayAngle = Math.tan(toRadian(rayAngle));
    const sinRayAngle = Math.sin(toRadian(rayAngle));
    const cosRayAngle = Math.cos(toRadian(rayAngle));

    let horizDistance = Infinity;
    let horHitX = this.positionX;
    let horHitY = this.positionY;

    let horizYAdjust = null;
    let nextHorizYAdjust = null;
    let horStepY = null;

    if(sinRayAngle > 0) {
        horizYAdjust = 1;
        nextHorizYAdjust = Camera.TILE_HEIGHT;
        horStepY = Camera.TILE_HEIGHT;
    } else {
        horizYAdjust = -1;
        nextHorizYAdjust = 0;
        horStepY = -Camera.TILE_HEIGHT;
    }

    let horStepX = horStepY / tanRayAngle;
    let nextHorizY = Math.floor(this.positionY / Camera.TILE_HEIGHT) * Camera.TILE_HEIGHT + nextHorizYAdjust;
    let nextHorizX = this.positionX + (nextHorizY - this.positionY) / tanRayAngle;

    while (nextHorizX >= 0 && nextHorizX < mapWidth * Camera.TILE_WIDTH && nextHorizY >= 0 && nextHorizY < mapHeight * Camera.TILE_HEIGHT) {
        const mapX = Math.floor(nextHorizX / Camera.TILE_WIDTH);
        const mapY = Math.floor((nextHorizY + horizYAdjust) / Camera.TILE_HEIGHT);

        if(!visualMap[mapY] || !visualMap[mapY][mapX]) {
            nextHorizX += horStepX;
            nextHorizY += horStepY;
            continue;
        }

        horizDistance = Math.sqrt((nextHorizX - this.positionX) ** 2 + (nextHorizY - this.positionY) ** 2);
        horHitX = nextHorizX;
        horHitY = nextHorizY;

        rayHits.push({
            "tileX": mapX,
            "tileY": mapY,
            "hitX": horHitX,
            "hitY": horHitY,
            "distance": horizDistance,
            "textureOffset": sinRayAngle > 0 ? Camera.TILE_HEIGHT - horHitX % Camera.TILE_HEIGHT : horHitX % Camera.TILE_HEIGHT,
            "hitBy": "HORIZONTAL"
        });

        const interactiveTile = interactiveMap[mapY][mapX];

        if ((!interactiveTile || !interactiveTile.isWindow) && this.positionZ < Camera.TILE_HEIGHT) {
            break;
        }

        nextHorizX += horStepX;
        nextHorizY += horStepY;
    }

    let vertDistance = Infinity;
    let vertHitX = this.positionX;
    let vertHitY = this.positionY;

    let vertXAdjust = null;
    let nextVertXAdjust = null;
    let verStepX = null;

    if(cosRayAngle > 0) {
        vertXAdjust = 1;
        nextVertXAdjust = Camera.TILE_WIDTH;
        verStepX = Camera.TILE_WIDTH;
    } else {
        vertXAdjust = -1;
        nextVertXAdjust = 0;
        verStepX = -Camera.TILE_WIDTH;
    }

    let verStepY = verStepX * tanRayAngle;
    let nextVertX = Math.floor(this.positionX / Camera.TILE_WIDTH) * Camera.TILE_WIDTH + nextVertXAdjust;
    let nextVertY = this.positionY + (nextVertX - this.positionX) * tanRayAngle;

    while (nextVertX >= 0 && nextVertX < mapWidth * Camera.TILE_WIDTH && nextVertY >= 0 && nextVertY < mapHeight * Camera.TILE_HEIGHT) {
        const mapX = Math.floor((nextVertX + vertXAdjust) / Camera.TILE_WIDTH);
        const mapY = Math.floor(nextVertY / Camera.TILE_HEIGHT);

        if(!visualMap[mapY] || !visualMap[mapY][mapX]) {
            nextVertX += verStepX;
            nextVertY += verStepY;
            continue;
        }

        vertDistance = Math.sqrt((nextVertX - this.positionX) ** 2 + (nextVertY - this.positionY) ** 2);
        vertHitX = nextVertX;
        vertHitY = nextVertY;

        rayHits.push({
            "tileX": mapX,
            "tileY": mapY,
            "hitX": vertHitX,
            "hitY": vertHitY,
            "distance": vertDistance,
            "textureOffset": cosRayAngle > 0 ? vertHitY % Camera.TILE_WIDTH : Camera.TILE_WIDTH - vertHitY % Camera.TILE_WIDTH,
            "hitBy": "VERTICAL"
        });   
        
        const interactiveTile = interactiveMap[mapY][mapX];

        if ((!interactiveTile || !interactiveTile.isWindow) && this.positionZ < Camera.TILE_WIDTH) {
            break;
        }

        nextVertX += verStepX;
        nextVertY += verStepY;
    }

    return rayHits;
}

Raycaster.prototype.checkRayIntersectionSingle = function(rayAngle, tilemap, ignoreWindows) {
    const mapWidth = tilemap[0].length;
    const mapHeight = tilemap.length;

    rayAngle = rayAngle % 360;
    
    if (rayAngle < 0) {
        rayAngle += 360;
    }

    const tanRayAngle = Math.tan(toRadian(rayAngle));
    const sinRayAngle = Math.sin(toRadian(rayAngle));
    const cosRayAngle = Math.cos(toRadian(rayAngle));

    let horizRay = null;
    let horizDistance = Infinity;
    let horHitX = this.positionX;
    let horHitY = this.positionY;

    let horizYAdjust = null;
    let nextHorizYAdjust = null;
    let horStepY = null;

    if(sinRayAngle > 0) {
        horizYAdjust = 1;
        nextHorizYAdjust = Camera.TILE_HEIGHT;
        horStepY = Camera.TILE_HEIGHT;
    } else {
        horizYAdjust = -1;
        nextHorizYAdjust = 0;
        horStepY = -Camera.TILE_HEIGHT;
    }

    let horStepX = horStepY / tanRayAngle;

    let nextHorizY = Math.floor(this.positionY / Camera.TILE_HEIGHT) * Camera.TILE_HEIGHT + nextHorizYAdjust;
    let nextHorizX = this.positionX + (nextHorizY - this.positionY) / tanRayAngle;

    while (nextHorizX >= 0 && nextHorizX < mapWidth * Camera.TILE_WIDTH && nextHorizY >= 0 && nextHorizY < mapHeight * Camera.TILE_HEIGHT) {
        const mapX = Math.floor(nextHorizX / Camera.TILE_WIDTH);
        const mapY = Math.floor((nextHorizY + horizYAdjust) / Camera.TILE_HEIGHT);
        const tileID = tilemap[mapY]?.[mapX];

        if (tileID !== 0) {
            horizDistance = Math.sqrt((nextHorizX - this.positionX) ** 2 + (nextHorizY - this.positionY) ** 2);
            horHitX = nextHorizX;
            horHitY = nextHorizY;

            horizRay = {
                "tileID": tileID,
                "tileX": mapX,
                "tileY": mapY,
                "hitX": horHitX,
                "hitY": horHitY,
                "distance": horizDistance,
                "wallHitX": 0,
                "wallHitY": sinRayAngle > 0 ? Camera.WALL_Y_POSITIVE : Camera.WALL_Y_NEGATIVE,
                "textureOffset": sinRayAngle > 0 ? Camera.TILE_HEIGHT - horHitX % Camera.TILE_HEIGHT : horHitX % Camera.TILE_HEIGHT,
                "hitBy": "HORIZONTAL"
            }

            if (tileID !== 3 || ignoreWindows) {
                break;
            }
        }

        nextHorizX += horStepX;
        nextHorizY += horStepY;
    }

    let vertRay = null;
    let vertDistance = Infinity;
    let vertHitX = this.positionX;
    let vertHitY = this.positionY;

    let vertXAdjust = null;
    let nextVertXAdjust = null;
    let verStepX = null;

    if(cosRayAngle > 0) {
        vertXAdjust = 1;
        nextVertXAdjust = Camera.TILE_WIDTH;
        verStepX = Camera.TILE_WIDTH;
    } else {
        vertXAdjust = -1;
        nextVertXAdjust = 0;
        verStepX = -Camera.TILE_WIDTH;
    }

    let verStepY = verStepX * tanRayAngle;

    let nextVertX = Math.floor(this.positionX / Camera.TILE_WIDTH) * Camera.TILE_WIDTH + nextVertXAdjust;
    let nextVertY = this.positionY + (nextVertX - this.positionX) * tanRayAngle;

    while (nextVertX >= 0 && nextVertX < mapWidth * Camera.TILE_WIDTH && nextVertY >= 0 && nextVertY < mapHeight * Camera.TILE_HEIGHT) {
        const mapX = Math.floor((nextVertX + vertXAdjust) / Camera.TILE_WIDTH);
        const mapY = Math.floor(nextVertY / Camera.TILE_HEIGHT);
        const tileID = tilemap[mapY]?.[mapX];

        if (tileID !== 0) {
            vertDistance = Math.sqrt((nextVertX - this.positionX) ** 2 + (nextVertY - this.positionY) ** 2);
            vertHitX = nextVertX;
            vertHitY = nextVertY;

            vertRay = {
                "tileID": tileID,
                "tileX": mapX,
                "tileY": mapY,
                "hitX": vertHitX,
                "hitY": vertHitY,
                "distance": vertDistance,
                "wallHitX": cosRayAngle > 0 ? Camera.WALL_X_POSITIVE : Camera.WALL_X_NEGATIVE,
                "wallHitY": 0,
                "textureOffset": cosRayAngle > 0 ? Camera.TILE_WIDTH - horHitX % Camera.TILE_WIDTH : horHitX % Camera.TILE_WIDTH,
                "hitBy": "HORIZONTAL"
            }

            if (tileID !== 3 || ignoreWindows) {
                break;
            }
        }

        nextVertX += verStepX;
        nextVertY += verStepY;
    }

    return horizDistance < vertDistance ? horizRay : vertRay;
}

Raycaster.prototype.drawRays = function(rayIntersectionsArraySorted, pixelColumn, gameMap, correctedRayAngle, graphics) {
    const WALL_HEIGHT = 1;
    const visualMap = gameMap.layers["floor"];
    const interactiveMap = gameMap.layers["collision"];

    for(let i = 0; i < rayIntersectionsArraySorted.length; i++) {
        const { tileX, tileY, hitX, hitY, distance, textureOffset, hitBy } = rayIntersectionsArraySorted[i];

        const maxDistance = 2000;
        const shadingFactor = (1 - Math.exp(-distance / maxDistance));

        const correctedDistance = distance * this.fishEyeFixes[pixelColumn];
        const ratio = this.distanceToPlane / correctedDistance;
        const projectionHeight = Camera.TILE_HEIGHT * this.distanceToPlane / correctedDistance;

        const wallBottom = ratio * this.positionZ + this.PROJECTION_HEIGHT - this.pitchOffset;
        const wallTop = wallBottom - projectionHeight * WALL_HEIGHT;
        const wallHeight = Math.floor(wallBottom - wallTop);

        const visualTile = visualMap[tileY][tileX];
        const interactiveTile = interactiveMap[tileY][tileX];
        const buffer = graphics[visualTile];

        if(i === 0) {
            this.drawSky(pixelColumn, correctedRayAngle);
        }

        this.drawWall(pixelColumn, textureOffset, wallTop, wallHeight, distance, buffer);

        if(i === rayIntersectionsArraySorted.length - 1) {
            this.drawFloor(pixelColumn, correctedRayAngle, Math.floor(wallBottom), gameMap, graphics);
        }
        
        //this.drawCeiling(Math.floor(wallTop), pixelColumn, correctedRayAngle, gameMap, graphics, position3D, pitchOffset);
    }
}

Raycaster.prototype.drawWall = function(pixelColumn, textureOffset, wallTop, wallHeight, distance, buffer) {
    //GANZ FETT EHRE AN CHATGPT!
    const TILE_HEIGHT = Camera.TILE_HEIGHT;
    const shadingFactor = 300 / (distance + 1);
    const sourceX = Math.floor(textureOffset);
    const sourceY = 0;
    const sourceWidth = 1;
    const sourceHeight = TILE_HEIGHT;

    const destinationX = pixelColumn;
    const destinationY = Math.floor(wallTop);
    const destinationWidth = 1;
    const destinationHeight = Math.floor(wallHeight);

    for (let y = 0; y < destinationHeight; y++) {
        const sourceIndex = ((sourceY + Math.floor(y * sourceHeight / destinationHeight)) * buffer.bitmap.width + sourceX) * this.bytesPerPixel;
        const destinationIndex = ((destinationY + y) * this.display.canvas.width + destinationX) * this.bytesPerPixel;

        const sourceR = buffer.imageData.data[sourceIndex];
        const sourceG = buffer.imageData.data[sourceIndex + 1];
        const sourceB = buffer.imageData.data[sourceIndex + 2];

        this.display.drawPixel(destinationIndex,
            Math.min(sourceR, sourceR * shadingFactor),
            Math.min(sourceG, sourceG * shadingFactor),
            Math.min(sourceB, sourceB * shadingFactor),
            255
        );
    }
}

Raycaster.prototype.drawSky = function(pixelColumn, rayAngle) {
    const xRatio = normalizeAngle(toAngle(rayAngle)) / 360;
    const sourceColumn = Math.floor(this.skybox.width * xRatio);
    const drawEnd = this.PROJECTION_HEIGHT + this.positionZ - this.pitchOffset;

    let sourceIndex = sourceColumn * this.bytesPerPixel;

    for (let row = 0; row < drawEnd; row++) {
        const targetIndex = this.bytesPerPixel * (row * this.width + pixelColumn);

        const red = this.skybox.imageData.data[sourceIndex];
        const green = this.skybox.imageData.data[sourceIndex + 1];
        const blue = this.skybox.imageData.data[sourceIndex + 2];

        this.display.drawPixel(targetIndex, red, green, blue, 255);
        sourceIndex += this.bytesPerPixel * this.skybox.width;
    }
}

Raycaster.prototype.drawFloor = function(pixelColumn, rayAngle, wallBottom, gameMap, graphics) {
    const bottomMap = gameMap.layers["bottom"];
    const visualMap = gameMap.layers["floor"];
    const interactiveMap = gameMap.layers["collision"];
    const byteStep = this.bytesPerPixel * this.width;

    let targetIndex = this.bytesPerPixel * (wallBottom * this.width + pixelColumn);

    for (let row = wallBottom + 1; row < this.height; row++) {
        const straightDistance = this.positionZ / (row + this.pitchOffset - this.PROJECTION_HEIGHT) * this.distanceToPlane;
        const diagDist = straightDistance * this.inverseFishEyeFixes[pixelColumn];

        const xEnd = ~~(diagDist * Math.cos(rayAngle) + this.positionX);
        const yEnd = ~~(diagDist * Math.sin(rayAngle) + this.positionY);
    
        const cellX = ~~(xEnd / Camera.TILE_WIDTH);
        const cellY = ~~(yEnd / Camera.TILE_HEIGHT);

        if (cellX < gameMap.width && cellY < gameMap.height && cellX > 0 && cellY > 0) {
            const bottomTileID = bottomMap[cellY][cellX];
            const visualTileID = visualMap[cellY][cellX];
            const interactiveTile = interactiveMap[cellY][cellX];

            if(bottomTileID === null || visualTileID !== 0 && (!interactiveTile || !interactiveTile.isWindow)) {
                targetIndex += byteStep;
                continue;
            }

            const buffer = graphics[bottomTileID];
            const shadingFactor = 300 / (diagDist + 1);
            const sourceData = buffer.imageData.data;
            const tileRow = ~~(xEnd % Camera.TILE_WIDTH);
            const tileCol = ~~(yEnd % Camera.TILE_HEIGHT);

            const sourceIndex = this.bytesPerPixel * (tileCol * Camera.TILE_HEIGHT + tileRow);
            const sourceR = sourceData[sourceIndex];
            const sourceG = sourceData[sourceIndex + 1];
            const sourceB = sourceData[sourceIndex + 2];

            this.display.drawPixel(targetIndex,
                Math.min(sourceR, sourceR * shadingFactor),
                Math.min(sourceG, sourceG * shadingFactor),
                Math.min(sourceB, sourceB * shadingFactor),
                255
            );
            targetIndex += byteStep;
        }
    }
}

Raycaster.prototype.drawSprites = function() {

}