export const Move3DComponent = function() {
    this.isMovingUp = false;
    this.isMovingDown = false;
    this.isMovingLeft = false;
    this.isMovingRight = false;
    this.isJumping = false;
    this.isCrouching = false;
    this.isFalling = false;
    this.speed = 0;
    this.acceleration = 0;
    this.initialAcceleration = 0;
}