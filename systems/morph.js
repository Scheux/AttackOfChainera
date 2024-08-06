import { SpriteComponent } from "../components/sprite.js";

export const MorphSystem = function() {
    this.id = "MorphSystem";
}

/**
 * Morphs the sprite of an entity.
 * 
 * @param {object} gameContext - The game context.
 * @param {object} entity - The entity whose sprite will be morphed.
 * @param {Array} spriteData - The sprite data containing [spriteSetID, spriteAnimationID].
 * @param {object} config - The configuration object.
 * @param {boolean} [config.isStatic] - Whether the sprite is static.
 * @param {number} [config.frameIndex] - The frame index to set.
 * @returns {void}
 */

MorphSystem.morphSprite = function(gameContext, entity, spriteData, config) {
    if(!spriteData) {
        console.warn(`SpriteData cannot be undefined! Returning...`);
        return;
    }

    const { spriteManager } = gameContext;
    const spriteComponent = entity.components.getComponent(SpriteComponent);
    const spriteID = spriteComponent.getSpriteID();

    const sprite = spriteManager.getSprite(spriteID);
    const [spriteSetID, spriteAnimationID] = spriteData;
    const currentSpriteSetID = sprite.getConfig().id;
    const currentSpriteConfigID = sprite.getAnimation().id;

    if(spriteSetID !== currentSpriteSetID || (spriteSetID === currentSpriteSetID && spriteAnimationID !== currentSpriteConfigID)) {
        spriteManager.updateSprite(spriteID, spriteSetID, spriteAnimationID);
    }

    if(config) {
        const isStatic = config["isStatic"];
        const frameIndex = config["frameIndex"];

        if(isStatic !== undefined) {
            sprite.setStatic(isStatic);
        }

        if(frameIndex !== undefined) {
            sprite.setFrame(frameIndex);
        }
    }
}