export const PositionComponent = function() {
    this.positionX = 0;
    this.positionY = 0;
    this.tileX = 0;
    this.tileY = 0;
    this.dimX = 0;
    this.dimY = 0;
    this.rotation = 0;
    this.mapID = null;
    this.direction = PositionComponent.DIRECTION_SOUTH;
}

PositionComponent.DIRECTION_NORTH = 0;
PositionComponent.DIRECTION_EAST = 1;
PositionComponent.DIRECTION_SOUTH = 2;
PositionComponent.DIRECTION_WEST = 3;