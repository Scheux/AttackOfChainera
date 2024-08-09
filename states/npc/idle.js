import { PositionComponent } from "../../components/position.js";
import { Entity } from "../../source/entity/entity.js";
import { State } from "../../source/state/state.js";
import { DirectionSystem } from "../../systems/direction.js";
import { MorphSystem } from "../../systems/morph.js";

export const NPCIdleState = function() {
    State.call(this);
}

NPCIdleState.prototype = Object.create(State.prototype);
NPCIdleState.prototype.constructor = NPCIdleState;

NPCIdleState.prototype.enter = function(stateMachine) {
    const entity = stateMachine.getContext();
}

NPCIdleState.prototype.exit = function(stateMachine) {
    const entity = stateMachine.getContext();
}

NPCIdleState.prototype.onEventEnter = function(stateMachine, gameContext, initator) {
    const entity = stateMachine.getContext();
    const { client } = gameContext;

    const positionComponent = entity.components.getComponent(PositionComponent);
    const spriteData = new Map([
        [PositionComponent.DIRECTION_NORTH, entity.config.sprites["idle_up"]],
        [PositionComponent.DIRECTION_EAST, entity.config.sprites["idle_right"]],
        [PositionComponent.DIRECTION_SOUTH, entity.config.sprites["idle_down"]],
        [PositionComponent.DIRECTION_WEST, entity.config.sprites["idle_left"]]
    ]);

    client.soundPlayer.playSound("aah");
    
    DirectionSystem.lookAt(entity, initator);
    entity.events.emit(Entity.EVENT_SPRITE_UPDATE, spriteData.get(positionComponent.direction), null);
    //MorphSystem.morphSprite(gameContext, entity, spriteData.get(positionComponent.direction));
}