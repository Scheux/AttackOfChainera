import { ImageBuffer } from "../graphics/imageBuffer.js";
import { normalizeAngle, toAngle, toRadian } from "../helpers.js";
import { ResourceLoader } from "../resourceLoader.js";
import { Camera } from "./camera.js";
import { Canvas } from "./canvas.js";

export const Raycaster = function() {
    this.fov = 60;
    this.positionX = 0;
    this.positionY = 0;
    this.positionZ = 0;
    this.rotation = 0;
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

Raycaster.SHADOW_DISTANCE = 16;
Raycaster.WALL_X_POSITIVE = -1;
Raycaster.WALL_X_NEGATIVE = 1;
Raycaster.WALL_Y_POSITIVE = -1;
Raycaster.WALL_Y_NEGATIVE = 1;

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

Raycaster.prototype.raycast = function(gameContext) {
    const { mapLoader, renderer } = gameContext;
    const gameMap = mapLoader.getActiveMap();

    if(!gameMap) {
        return;
    }

    const cameraAngle = toRadian(this.rotation); //can be precalced!
    //rotation is always normalized from 0 tp 360

    for(let rayIndex = 0; rayIndex < this.rayAngles.length; rayIndex++) {
        const rayAngle = this.rayAngles[rayIndex];
        const correctedRayAngle = cameraAngle + rayAngle;
        const rayAngleDegrees = toAngle(correctedRayAngle);

        const rayIntersections = this.checkRayIntersections(rayAngleDegrees, gameMap)
        const rayIntersectionsArraySorted = rayIntersections.sort((a, b) => b.distance - a.distance);

        this.drawRays(gameContext, rayIntersectionsArraySorted, rayIndex, gameMap, correctedRayAngle, rayAngleDegrees);
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
    const radianAngle = toRadian(rayAngle);
    const tanRayAngle = Math.tan(radianAngle);
    const sinRayAngle = Math.sin(radianAngle);
    const cosRayAngle = Math.cos(radianAngle);

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

        break;

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
        
        break;
        
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
                "wallHitY": sinRayAngle > 0 ? Raycaster.WALL_Y_POSITIVE : Raycaster.WALL_Y_NEGATIVE,
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
                "wallHitX": cosRayAngle > 0 ? Raycaster.WALL_X_POSITIVE : Raycaster.WALL_X_NEGATIVE,
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

Raycaster.prototype.drawRays = function(gameContext, rayIntersectionsArraySorted, pixelColumn, gameMap, rayAngleRadians, rayAngleDegrees) {
    const realTime = gameContext.timer.getRealTime();
    const WALL_HEIGHT = 1;
    const visualMap = gameMap.layers["floor"];
    const collisionMap = gameMap.layers["collision"];

    for(let i = 0; i < rayIntersectionsArraySorted.length; i++) {
        const { tileX, tileY, hitX, hitY, distance, textureOffset, hitBy } = rayIntersectionsArraySorted[i];
        const correctedDistance = distance * this.fishEyeFixes[pixelColumn];
        const ratio = this.distanceToPlane / correctedDistance;
        const projectionHeight = Camera.TILE_HEIGHT * ratio;

        const wallBottom = ratio * this.positionZ + this.PROJECTION_HEIGHT - this.pitchOffset;
        const wallTop = wallBottom - projectionHeight * WALL_HEIGHT;
        const wallHeight = wallBottom - wallTop;

        const visualTile = visualMap[tileY][tileX];
        const collisionTile = collisionMap[tileY][tileX];

        const buffer = gameContext.spriteManager.tileSprites[visualTile[0]].getAnimationFrame(visualTile[1], realTime)[0];

        if(i === 0) {
            this.drawSky(pixelColumn, rayAngleDegrees);
            this.drawCeiling(gameContext, pixelColumn, rayAngleRadians, wallTop, gameMap);
        }

        this.drawWall(pixelColumn, textureOffset, wallTop, wallHeight, distance, buffer);

        if(i === rayIntersectionsArraySorted.length - 1) {
            this.drawFloor(gameContext, pixelColumn, rayAngleRadians, wallBottom, gameMap);
        }
    }
}

Raycaster.prototype.drawWall = function(pixelColumn, textureOffset, wallTop, wallHeight, distance, buffer) {
    const displayWidth = this.display.canvas.width;
    const bufferWidth = buffer.bitmap.width;
    const targetImageData = this.display.imageData.data;
    const bufferImageData = buffer.imageData.data;

    const shadingFactor = Raycaster.SHADOW_DISTANCE / (distance + 0.1);
    const sourceX = Math.floor(textureOffset);
    const destinationX = pixelColumn;
    const destinationY = Math.floor(wallTop);
    const heightDifference = Camera.TILE_HEIGHT / wallHeight;

    for(let y = 0; y < wallHeight; y++) {
        const destinationPixelY = destinationY + y;
        const sourcePixelY = ~~(y * heightDifference);

        const destinationIndex = (destinationPixelY * displayWidth + destinationX) * this.bytesPerPixel;
        const sourceIndex = (sourcePixelY * bufferWidth + sourceX) * this.bytesPerPixel;

        const sourceR = bufferImageData[sourceIndex];
        const sourceG = bufferImageData[sourceIndex + 1];
        const sourceB = bufferImageData[sourceIndex + 2];

        targetImageData[destinationIndex] = Math.min(sourceR, sourceR * shadingFactor);
        targetImageData[destinationIndex + 1] = Math.min(sourceG, sourceG * shadingFactor);
        targetImageData[destinationIndex + 2] = Math.min(sourceB, sourceB * shadingFactor);
        targetImageData[destinationIndex + 3] = 255;
    }
}

Raycaster.prototype.drawSky = function(pixelColumn, rayAngleDegrees) {
    const targetImageData = this.display.imageData.data;
    const sourceImageData = this.skybox.imageData.data;

    const pixelStep = this.bytesPerPixel * this.skybox.width;
    const xRatio = normalizeAngle(rayAngleDegrees) / 360;
    const sourceColumn = ~~(this.skybox.width * xRatio);
    const drawEnd = this.PROJECTION_HEIGHT + this.positionZ - this.pitchOffset;

    let sourceIndex = sourceColumn * this.bytesPerPixel;

    for(let row = 0; row < drawEnd; row++) {
        const targetIndex = (row * this.width + pixelColumn) * this.bytesPerPixel;

        const sourceR = sourceImageData[sourceIndex];
        const sourceG = sourceImageData[sourceIndex + 1];
        const sourceB = sourceImageData[sourceIndex + 2];

        targetImageData[targetIndex] = sourceR;
        targetImageData[targetIndex + 1] = sourceG;
        targetImageData[targetIndex + 2] = sourceB;
        targetImageData[targetIndex + 3] = 255;

        sourceIndex += pixelStep;
    }
}

Raycaster.prototype.drawFloor = function(gameContext, pixelColumn, rayAngle, wallBottom, gameMap) {
    const targetImageData = this.display.imageData.data;

    const pixelStep = this.bytesPerPixel * this.width;
    const mapWidth = gameMap.width;
    const mapHeight = gameMap.height;
    const bottomMap = gameMap.layers["bottom"];
    const visualMap = gameMap.layers["floor"];

    const cosAngle = Math.cos(rayAngle);
    const sinAngle = Math.sin(rayAngle);
    const destinationY = Math.floor(wallBottom);

    let targetIndex = this.bytesPerPixel * (destinationY * this.width + pixelColumn);

    for (let row = destinationY + 1; row <= this.height; row++) {
        const straightDistance = this.positionZ / (row + this.pitchOffset - this.PROJECTION_HEIGHT) * this.distanceToPlane;
        const diagDist = straightDistance * this.inverseFishEyeFixes[pixelColumn];

        const xEnd = ~~(diagDist * cosAngle + this.positionX);
        const yEnd = ~~(diagDist * sinAngle + this.positionY);
        const cellX = ~~(xEnd / Camera.TILE_WIDTH);
        const cellY = ~~(yEnd / Camera.TILE_HEIGHT);

        if(cellX < 0 || cellX >= mapWidth || cellY < 0 || cellY >= mapHeight) {
            continue;
        }

        const bottomTile = bottomMap[cellY][cellX];
        const visualTile = visualMap[cellY][cellX];

        if(bottomTile === null || visualTile !== null) {
            targetIndex += pixelStep;
            continue;
        }

        const buffer = gameContext.spriteManager.tileSprites[bottomTile[0]].getAnimationFrame(bottomTile[1], 0)[0];;
        const shadingFactor = Raycaster.SHADOW_DISTANCE / (diagDist + 0.1);
        const sourceData = buffer.imageData.data;
        const tileRow = xEnd % Camera.TILE_WIDTH;
        const tileColumn = yEnd % Camera.TILE_HEIGHT;

        const sourceIndex = this.bytesPerPixel * (tileColumn * Camera.TILE_HEIGHT + tileRow);
        const sourceR = sourceData[sourceIndex];
        const sourceG = sourceData[sourceIndex + 1];
        const sourceB = sourceData[sourceIndex + 2];

        targetImageData[targetIndex] = Math.min(sourceR, sourceR * shadingFactor);
        targetImageData[targetIndex + 1] = Math.min(sourceG, sourceG * shadingFactor),
        targetImageData[targetIndex + 2] = Math.min(sourceB, sourceB * shadingFactor),
        targetImageData[targetIndex + 3] = 255
      
        targetIndex += pixelStep;
    }
}

Raycaster.prototype.drawCeiling = function(gameContext, pixelColumn, rayAngle, wallTop, gameMap) {
    const targetImageData = this.display.imageData.data;

    const pixelStep = this.bytesPerPixel * this.width;
    const mapWidth = gameMap.width;
    const mapHeight = gameMap.height;
    const visualMap = gameMap.layers["floor"];
    const ceilMap = gameMap.layers["top"];

    const cosAngle = Math.cos(rayAngle);
    const sinAngle = Math.sin(rayAngle);
    const destinationY = Math.floor(wallTop);

    let targetIndex = this.bytesPerPixel * (destinationY * this.width + pixelColumn);

    for(let row = destinationY; row >= 0; row--) {
        const straightDistance = this.positionZ / (this.PROJECTION_HEIGHT - row - this.pitchOffset) * this.distanceToPlane;
        const diagDist = straightDistance * this.inverseFishEyeFixes[pixelColumn];

        const xEnd = ~~(diagDist * cosAngle + this.positionX);
        const yEnd = ~~(diagDist * sinAngle + this.positionY);
        const cellX = ~~(xEnd / Camera.TILE_WIDTH);
        const cellY = ~~(yEnd / Camera.TILE_HEIGHT);

        if(cellX < 0 || cellX >= mapWidth || cellY < 0 || cellY >= mapHeight) {
            continue;
        }

        const ceilTile = ceilMap[cellY][cellX];
        const visualTile = visualMap[cellY][cellX];

        if (ceilTile === null || visualTile !== null) {
            targetIndex -= pixelStep;
            continue;
        }

        const buffer = gameContext.spriteManager.tileSprites[ceilTile[0]].getAnimationFrame(ceilTile[1], 0)[0];;
        const shadingFactor = Raycaster.SHADOW_DISTANCE / (diagDist + 0.1);
        const sourceData = buffer.imageData.data;
        const tileRow = xEnd % Camera.TILE_WIDTH;
        const tileColumn = yEnd % Camera.TILE_HEIGHT;

        const sourceIndex = this.bytesPerPixel * (tileColumn * Camera.TILE_HEIGHT + tileRow);
        const sourceR = sourceData[sourceIndex];
        const sourceG = sourceData[sourceIndex + 1];
        const sourceB = sourceData[sourceIndex + 2];

        targetImageData[targetIndex] = Math.min(sourceR, sourceR * shadingFactor);
        targetImageData[targetIndex + 1] = Math.min(sourceG, sourceG * shadingFactor);
        targetImageData[targetIndex + 2] = Math.min(sourceB, sourceB * shadingFactor);
        targetImageData[targetIndex + 3] = 255;

        targetIndex -= pixelStep;
    }
}

Raycaster.prototype.drawSprites = function() {

}