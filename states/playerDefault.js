import { Move3DComponent } from "../components/move3D.js";
import { Position3DComponent } from "../components/position3D.js";
import { Camera } from "../source/camera/camera.js";
import { toAngle, toRadian } from "../source/helpers.js";
import { State } from "../source/state/state.js";

export const PlayerDefault = function() {
    State.call(this);
}

const MAX_DISTANCE = 4;

PlayerDefault.prototype = Object.create(State.prototype);
PlayerDefault.prototype.constructor = PlayerDefault;

PlayerDefault.prototype.enter = function(stateMachine) {
    const entity = stateMachine.getContext();
}

PlayerDefault.prototype.update = function(stateMachine, gameContext) {
    const { timer, mapLoader } = gameContext; 
    const entity = stateMachine.getContext();
    const gameMap = mapLoader.getActiveMap();

    if(!gameMap) {
        return;
    }

    const position3D = entity.components.getComponent(Position3DComponent);
    const move3D = entity.components.getComponent(Move3DComponent);

    const floor = gameMap.layers["floor"];
    const collisionLayer = gameMap.layers["collision"];

    const deltaTime = timer.getFixedDeltaTime();

    const entityRotation = position3D.rotation;
    const entitySpeed = move3D.speed * deltaTime;

    const gravity = 10;
    let dirX = 0;
    let dirY = 0;
    
    if(move3D.isJumping && !move3D.isFalling) {
        move3D.acceleration -= gravity * deltaTime;
        position3D.positionZ += move3D.acceleration * deltaTime;

        if(position3D.positionZ >= Camera.TILE_HEIGHT) {
            move3D.isJumping = false;
            move3D.isFalling = true;
        }
    }

    if(position3D.positionZ > (Camera.TILE_HEIGHT / 2) && !move3D.isJumping) {
        move3D.acceleration += gravity * deltaTime;
        position3D.positionZ -= move3D.acceleration * deltaTime;

        const tileX = Math.floor(position3D.positionX / Camera.TILE_WIDTH);
        const tileY = Math.floor(position3D.positionY / Camera.TILE_HEIGHT);

        if(floor[tileY][tileX] !== null) {
            if(position3D.positionZ < Camera.TILE_HEIGHT) {
                position3D.positionZ = Camera.TILE_HEIGHT;
                move3D.isFalling = false;
                move3D.isJumping = false;
                move3D.acceleration = move3D.acceleration_default;
            }
        } else {
            if(position3D.positionZ <= Camera.TILE_HEIGHT / 2) {
                position3D.positionZ = Camera.TILE_HEIGHT / 2;
                move3D.isFalling = false;
                move3D.isJumping = false;
                move3D.acceleration = move3D.acceleration_default;
            }
        }
    }
    
    if(!move3D.isMovingUp && !move3D.isMovingDown && !move3D.isMovingLeft && !move3D.isMovingRight) {
        return;
    }
    
    if(move3D.isMovingUp) {
        dirX += Math.cos(toRadian(entityRotation));
        dirY += Math.sin(toRadian(entityRotation));
    }

    if(move3D.isMovingRight) {
        dirX += Math.cos(toRadian(entityRotation + 90));
        dirY += Math.sin(toRadian(entityRotation + 90));
    }

    if(move3D.isMovingDown) {
        dirX -= Math.cos(toRadian(entityRotation));
        dirY -= Math.sin(toRadian(entityRotation));
    }

    if(move3D.isMovingLeft) {
        dirX += Math.cos(toRadian(entityRotation - 90));
        dirY += Math.sin(toRadian(entityRotation - 90));
    }

    const normalizedDirection = Math.sqrt(dirX * dirX + dirY * dirY);

    if(normalizedDirection > 0) {
        dirX /= normalizedDirection;
        dirY /= normalizedDirection;
    }

    let nextPositionX = position3D.positionX + dirX * entitySpeed;
    let nextPositionY = position3D.positionY + dirY * entitySpeed;
    
    let movementAngle = toAngle(Math.atan2(dirY, dirX));
    let ray = gameContext.renderer.raycaster.checkRayIntersectionSingle(nextPositionX, nextPositionY, movementAngle, collisionLayer);

    if (ray && ray.distance < MAX_DISTANCE) {
        nextPositionX = position3D.positionX + dirX * entitySpeed;
        nextPositionY = position3D.positionY;
        movementAngle = Math.atan2(0, dirX) * (180 / Math.PI);
        ray = gameContext.renderer.raycaster.checkRayIntersectionSingle(nextPositionX, nextPositionY, movementAngle, collisionLayer);

        if (ray && ray.distance < MAX_DISTANCE) {
            nextPositionX = position3D.positionX;
            nextPositionY = position3D.positionY + dirY * entitySpeed;
            movementAngle = Math.atan2(dirY, 0) * (180 / Math.PI);
            ray = gameContext.renderer.raycaster.checkRayIntersectionSingle(nextPositionX, nextPositionY, movementAngle, collisionLayer);

            if (ray && ray.distance < MAX_DISTANCE) {
                return;
            }
        }
    }
   
    position3D.positionX = nextPositionX;
    position3D.positionY = nextPositionY;
}