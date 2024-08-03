export const rectangularCollision = function(param_x1, param_y1, param_width1, param_height1, param_x2, param_y2, param_width2, param_height2) {
    const leftCollision = param_x1 + param_width1 >= param_x2;
    const rightCollision = param_x1 <= param_x2 + param_width2;
    const topCollision = param_y1 + param_height1 >= param_y2;
    const bottomCollision = param_y1 <= param_y2 + param_height2;
  
    if (leftCollision && rightCollision && topCollision && bottomCollision) return true;
    return false;
  }
  
  export const coordinateCollision = function(param_x1, param_x2, param_y1, param_y2) {
    const horizontalCollision = param_x1 === param_x2;
    const verticalCollision = param_y1 === param_y2;
  
    return horizontalCollision && verticalCollision;
  }
  
  export const isCircleRectangleIntersect = function(cx, cy, r, rx, ry, rw, rh) {
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    
    const distanceX = cx - closestX;
    const distanceY = cy - closestY;
    
    const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
    return distanceSquared < (r * r);
  }
  
  export const isCircleCicleIntersect = function(cx1, cy1, r1, cx2, cy2, r2) {
    const distanceX = cx1 - cx2;
    const distanceY = cy1 - cy2;
    const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
    const radiiSum = r1 + r2;
  
    return distanceSquared < (radiiSum * radiiSum);
  }