export const MoveComponent = function() {
    this.isMovingUp = false;
    this.isMovingDown = false;
    this.isMovingLeft = false;
    this.isMovingRight = false;
    this.hasBoots = false;
    this.isRunning = false;

    this.speed = 32;
    this.acceleration = 0;

    this.targetX = 0;
    this.targetY = 0;
    this.targetTileX = 0;
    this.targetTileY = 0;
    this.targetDirection = 0;
}