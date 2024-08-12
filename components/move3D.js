export const Move3DComponent = function() {
    this.isMovingUp = false;
    this.isMovingDown = false;
    this.isMovingLeft = false;
    this.isMovingRight = false;
    this.isJumping = false;
    this.isCrouching = false;
    this.isFalling = false;

    this.speed = 64;
    this.acceleration = 32;
    this.acceleration_default = 32;

    this.sneakSpeed = 16;
    this.walkSpeed = 64;
    this.runSpeed = 300;
}