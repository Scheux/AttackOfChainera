import { MoveComponent } from "../../components/move.js";
import { PositionComponent } from "../../components/position.js";
import { Camera } from "../../source/camera/camera.js";
import { Entity } from "../../source/entity/entity.js";
import { State } from "../../source/state/state.js";

export const PlayerIdleState = function() {
    State.call(this);
}

PlayerIdleState.prototype = Object.create(State.prototype);
PlayerIdleState.prototype.constructor = PlayerIdleState;

PlayerIdleState.prototype.enter = function(stateMachine) {
    const entity = stateMachine.getContext();
    const positionComponent = entity.components.getComponent(PositionComponent);

    const spriteData = new Map([
        [PositionComponent.DIRECTION_NORTH, entity.config.sprites["idle_up"]],
        [PositionComponent.DIRECTION_EAST, entity.config.sprites["idle_right"]],
        [PositionComponent.DIRECTION_SOUTH, entity.config.sprites["idle_down"]],
        [PositionComponent.DIRECTION_WEST, entity.config.sprites["idle_left"]]
    ]);

    entity.events.emit(Entity.EVENT_SPRITE_UPDATE, spriteData.get(positionComponent.direction));
}

PlayerIdleState.prototype.update = function(stateMachine, gameContext) {
    const { mapLoader, renderer } = gameContext;
    const entity = stateMachine.getContext();
    const positionComponent = entity.components.getComponent(PositionComponent);
    const moveComponent = entity.components.getComponent(MoveComponent);
    const gameMap = mapLoader.getLoadedMap(positionComponent.mapID);

    if(!gameMap) {
        return false;
    }

    const spriteData = new Map([
        [PositionComponent.DIRECTION_NORTH, entity.config.sprites["idle_up"]],
        [PositionComponent.DIRECTION_EAST, entity.config.sprites["idle_right"]],
        [PositionComponent.DIRECTION_SOUTH, entity.config.sprites["idle_down"]],
        [PositionComponent.DIRECTION_WEST, entity.config.sprites["idle_left"]]
    ]);

    const isTilePassable = function(map, tileX, tileY) {
        const collision = map.getLayerTile("collision", tileX, tileY);

        if(collision === undefined || collision !== 0) {
            return false;
        }

        const entityTile = map.getTile(tileX, tileY);

        if(!entityTile || Object.keys(entityTile).length !== 0) {
            return false;
        }

        return true;
    }

    const setTarget = function(tileOffsetX, tileOffsetY, direction) {
        moveComponent.targetTileX = positionComponent.tileX + tileOffsetX;
        moveComponent.targetTileY = positionComponent.tileY + tileOffsetY;
        moveComponent.targetX = moveComponent.targetTileX * Camera.TILE_WIDTH;
        moveComponent.targetY = moveComponent.targetTileY * Camera.TILE_HEIGHT;

        entity.events.emit(Entity.EVENT_DIRECTION_UPDATE, direction);
        entity.events.emit(Entity.EVENT_SPRITE_UPDATE, spriteData.get(direction));
    }

    const checkConnections = async function(tileOffsetX, tileOffsetY, direction) {
        for(const connection of gameMap.connections) {
            const connectedMap = mapLoader.getLoadedMap(connection.id);
            const directionNameTable = new Map([
                [PositionComponent.DIRECTION_NORTH, "north"],
                [PositionComponent.DIRECTION_EAST, "east"],
                [PositionComponent.DIRECTION_SOUTH, "south"],
                [PositionComponent.DIRECTION_WEST, "west"]
            ]);

            if(connection.type !== directionNameTable.get(positionComponent.direction)) {
                continue;
            }

            const connectedMapTileX = positionComponent.tileX - connection.startX + tileOffsetX;
            const connectedMapTileY = positionComponent.tileY - connection.startY + tileOffsetY;
            const isPassable = isTilePassable(connectedMap, connectedMapTileX, connectedMapTileY);

            if(!isPassable) {
                return;
            }

            gameMap.removePointers(positionComponent.tileX, positionComponent.tileY, positionComponent.dimX, positionComponent.dimY, entity.id);

            positionComponent.mapID = connection.id;
            positionComponent.tileX -= connection.startX;
            positionComponent.tileY -= connection.startY;
            positionComponent.positionX -= connection.startX * Camera.TILE_WIDTH;
            positionComponent.positionY -= connection.startY * Camera.TILE_HEIGHT;

            setTarget(tileOffsetX, tileOffsetY, direction);
            stateMachine.setNextState(1);
            connectedMap.setPointers(moveComponent.targetTileX, moveComponent.targetTileY, positionComponent.dimX, positionComponent.dimY, entity.id);

            await gameContext.loadMap(connection.id);
            gameContext.parseMap(connection.id, false);
            renderer.shiftViewport(-connection.startX * Camera.TILE_WIDTH, -connection.startY * Camera.TILE_HEIGHT);
        }
    }

    if(moveComponent.isMovingRight) {
        const tileOffsetX = 1;
        const tileOffsetY = 0;

        setTarget(tileOffsetX, tileOffsetY, PositionComponent.DIRECTION_EAST);

        const isPassable = isTilePassable(gameMap, moveComponent.targetTileX, moveComponent.targetTileY);

        if(isPassable) {
            gameMap.removePointers(positionComponent.tileX, positionComponent.tileY, positionComponent.dimX, positionComponent.dimY, entity.id);
            gameMap.setPointers(moveComponent.targetTileX, moveComponent.targetTileY, positionComponent.dimX, positionComponent.dimY, entity.id);

            stateMachine.setNextState(1);
            stateMachine.update(gameContext);
        } else {
            if(moveComponent.targetTileX < gameMap.width) {
                return;
            }

            checkConnections(tileOffsetX, tileOffsetY, PositionComponent.DIRECTION_EAST);
        }

        return;
    }

    if(moveComponent.isMovingLeft) {
        const tileOffsetX = -1;
        const tileOffsetY = 0;

        setTarget(tileOffsetX, tileOffsetY, PositionComponent.DIRECTION_WEST);

        const isPassable = isTilePassable(gameMap, positionComponent.tileX + tileOffsetX, positionComponent.tileY + tileOffsetY);

        if(isPassable) {
            gameMap.removePointers(positionComponent.tileX, positionComponent.tileY, positionComponent.dimX, positionComponent.dimY, entity.id);
            gameMap.setPointers(moveComponent.targetTileX, moveComponent.targetTileY, positionComponent.dimX, positionComponent.dimY, entity.id);

            stateMachine.setNextState(1);
            stateMachine.update(gameContext);
        } else {
            if(moveComponent.targetTileX >= 0) {
                return;
            }

            checkConnections(tileOffsetX, tileOffsetY, PositionComponent.DIRECTION_WEST);
        }

        return;
    }

    if(moveComponent.isMovingUp) {
        const tileOffsetX = 0;
        const tileOffsetY = -1;

        setTarget(tileOffsetX, tileOffsetY, PositionComponent.DIRECTION_NORTH);

        const isPassable = isTilePassable(gameMap, positionComponent.tileX + tileOffsetX, positionComponent.tileY + tileOffsetY);

        if(isPassable) {
            gameMap.removePointers(positionComponent.tileX, positionComponent.tileY, positionComponent.dimX, positionComponent.dimY, entity.id);
            gameMap.setPointers(moveComponent.targetTileX, moveComponent.targetTileY, positionComponent.dimX, positionComponent.dimY, entity.id);

            stateMachine.setNextState(1);
            stateMachine.update(gameContext);
        } else {
            if(moveComponent.targetTileY >= 0) {
                return;
            }

            checkConnections(tileOffsetX, tileOffsetY, PositionComponent.DIRECTION_NORTH);
        }

        return;
    }

    if(moveComponent.isMovingDown) {
        const tileOffsetX = 0;
        const tileOffsetY = 1;

        setTarget(tileOffsetX, tileOffsetY, PositionComponent.DIRECTION_SOUTH);

        const isPassable = isTilePassable(gameMap, positionComponent.tileX + tileOffsetX, positionComponent.tileY + tileOffsetY);

        if(isPassable) {            
            gameMap.removePointers(positionComponent.tileX, positionComponent.tileY, positionComponent.dimX, positionComponent.dimY, entity.id);
            gameMap.setPointers(moveComponent.targetTileX, moveComponent.targetTileY, positionComponent.dimX, positionComponent.dimY, entity.id);
            
            stateMachine.setNextState(1);
            stateMachine.update(gameContext);
        } else {
            if(moveComponent.targetTileY < gameMap.height) {
                return;
            }

            checkConnections(tileOffsetX, tileOffsetY, PositionComponent.DIRECTION_SOUTH);
        }

        return;
    }
}