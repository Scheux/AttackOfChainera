export const Move3D = function() {
    this.isMovingUp = false;
    this.isMovingDown = false;
    this.isMovingLeft = false;
    this.isMovingRight = false;
    this.isJumping = false;
    this.isCrouching = false;
    this.isFalling = false;
    this.speed = 300;
    this.acceleration = 100;
    this.initialAcceleration = 100;
}