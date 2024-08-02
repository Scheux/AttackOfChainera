export const MoveComponent = function() {
    this.isMovingUp = false;
    this.isMovingDown = false;
    this.isMovingLeft = false;
    this.isMovingRight = false;
    this.hasBoots = false;
    this.isRunning = false;

    this.speed = 0;
    this.acceleration = 0;
}