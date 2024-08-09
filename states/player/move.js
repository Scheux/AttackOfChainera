import { MoveComponent } from "../../components/move.js";
import { PositionComponent } from "../../components/position.js";
import { Camera } from "../../source/camera/camera.js";
import { Entity } from "../../source/entity/entity.js";
import { State } from "../../source/state/state.js";

export const PlayerMoveState = function() {
    State.call(this);
}

PlayerMoveState.prototype = Object.create(State.prototype);
PlayerMoveState.prototype.constructor = PlayerMoveState;

PlayerMoveState.prototype.enter = function(stateMachine) {
    const entity = stateMachine.getContext();
    const positionComponent = entity.components.getComponent(PositionComponent);
    const moveComponent = entity.components.getComponent(MoveComponent);

    const moveTable = new Map([
        [PositionComponent.DIRECTION_NORTH, entity.config.sprites["walk_up"]],
        [PositionComponent.DIRECTION_EAST, entity.config.sprites["walk_right"]],
        [PositionComponent.DIRECTION_SOUTH, entity.config.sprites["walk_down"]],
        [PositionComponent.DIRECTION_WEST, entity.config.sprites["walk_left"]]
    ]);

    entity.events.emit(Entity.EVENT_SPRITE_UPDATE, moveTable.get(positionComponent.direction));
}

PlayerMoveState.prototype.exit = function(stateMachine) {
    const entity = stateMachine.getContext();

    const positionComponent = entity.components.getComponent(PositionComponent);
    const moveComponent = entity.components.getComponent(MoveComponent);

    positionComponent.tileX = moveComponent.targetTileX;
    positionComponent.tileY = moveComponent.targetTileY;

    entity.events.emit(Entity.EVENT_TARGET_REACHED, positionComponent.tileX, positionComponent.tileY);
}

PlayerMoveState.prototype.update = function(stateMachine, gameContext) {
    const { timer } = gameContext;
    const entity = stateMachine.getContext();
    const deltaTime = timer.getFixedDeltaTime();

    const positionComponent = entity.components.getComponent(PositionComponent);
    const moveComponent = entity.components.getComponent(MoveComponent);
    const distance = moveComponent.speed * deltaTime;

    switch(positionComponent.direction) {
        case PositionComponent.DIRECTION_NORTH: {
            if(positionComponent.positionY - distance < moveComponent.targetY) {
                positionComponent.positionY = moveComponent.targetY;
                entity.events.emit(Entity.EVENT_POSITION_UPDATE, 0, 0);
                stateMachine.setNextState(0);
            } else {
                entity.events.emit(Entity.EVENT_POSITION_UPDATE, 0, -distance);
            }
          
            break;
        }

        case PositionComponent.DIRECTION_EAST: {
            if(positionComponent.positionX + distance > moveComponent.targetX) {
                positionComponent.positionX = moveComponent.targetX;
                entity.events.emit(Entity.EVENT_POSITION_UPDATE, 0, 0);
                stateMachine.setNextState(0);
            } else {
                entity.events.emit(Entity.EVENT_POSITION_UPDATE, distance, 0);
            }

            break;
        }

        case PositionComponent.DIRECTION_SOUTH: {
            if(positionComponent.positionY + distance > moveComponent.targetY) {
                positionComponent.positionY = moveComponent.targetY;
                entity.events.emit(Entity.EVENT_POSITION_UPDATE, 0, 0);
                stateMachine.setNextState(0);
            } else {
                entity.events.emit(Entity.EVENT_POSITION_UPDATE, 0, distance);
            }
          
            break;
        }

        case PositionComponent.DIRECTION_WEST: {
            if(positionComponent.positionX - distance < moveComponent.targetX) {
                positionComponent.positionX = moveComponent.targetX;
                entity.events.emit(Entity.EVENT_POSITION_UPDATE, 0, 0);
                stateMachine.setNextState(0);
            } else {
                entity.events.emit(Entity.EVENT_POSITION_UPDATE, -distance, 0);
            }

            break;
        }
    }
}