import { PositionComponent } from "../components/position.js";
import { Entity } from "../source/entity/entity.js";

export const DirectionSystem = function() {
    this.id = "DirectionSystem";
}

/**
 * Changes the specified entities direction to the given direction.
 * 
 * @param {object} entity 
 * @param {int} newDirection 0, 1, 2 or 3 - Enum in PositionComponent
 */
DirectionSystem.changeDirection = function(entity, newDirection) {
    const positionComponent = entity.components.getComponent(PositionComponent);

    positionComponent.direction = newDirection;
    entity.events.emit(Entity.EVENT_DIRECTION_UPDATE, newDirection);
}

/**
 * Changes the specified entities direction to the opposite of the targets direction.
 * This imitates "looking at".
 * 
 * @param {object} entity 
 * @param {object} target 
 */
DirectionSystem.lookAt = function(entity, target) {
    const positionComponent = entity.components.getComponent(PositionComponent);
    const oppositeDirectionMap = new Map([
        [PositionComponent.DIRECTION_NORTH, PositionComponent.DIRECTION_SOUTH],
        [PositionComponent.DIRECTION_EAST, PositionComponent.DIRECTION_WEST],
        [PositionComponent.DIRECTION_SOUTH, PositionComponent.DIRECTION_NORTH],
        [PositionComponent.DIRECTION_WEST, PositionComponent.DIRECTION_EAST]
    ]);

    const targetDirection = target.components.getComponent(PositionComponent).direction;
    const newDirection = oppositeDirectionMap.get(targetDirection);

    positionComponent.direction = newDirection;
    entity.events.emit(Entity.EVENT_DIRECTION_UPDATE, newDirection);
}