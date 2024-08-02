const absoluteDifference = function([x1, y1], [x2, y2]) {
    return [
      Math.abs(x1 - x2),
      Math.abs(y1 - y2)
    ];
}
  
const subVector = function([x1, y1], [x2, y2]) {
    return [
      (x1 - x2),
      (y1 - y2)
    ];
}

const AStarNode = function(heuristic, gCost, fCost, currentPositionInMatrix, parent) {
    this.h = heuristic;
    this.g = gCost;
    this.f = fCost;
    this.position = currentPositionInMatrix;
    this.parent = parent;
}

export const AStar = function(matrix, startingPosition) {
    this.matrix = matrix;
    this.startingPosition = startingPosition;
    this.goal = null;
}

AStar.prototype.search = function(gLimit, targetTile, entityTile, validatorCallback) {
    if(!gLimit || !targetTile || !entityTile || !validatorCallback) {

        return null;
    }
    
    this.goal = this.setGoal(targetTile, entityTile);
    
    const openNodes = new Map();
    const visitedNodes = new Map();

    const startNode = this.createNode(0, this.startingPosition, null);
    const getKeyForPosition = (position) => position.join(',');

    openNodes.set(getKeyForPosition(startNode.position), startNode);

    while (openNodes.size !== 0) {
        const [lowestID, lowestNode] = this.findLowestFNode(openNodes);

        openNodes.delete(lowestID);
        visitedNodes.set(lowestID, lowestNode);

        if(this.goalCheck(lowestNode.position)) {

            return lowestNode;
        }

        const children = this.getChildren(lowestNode);
        const lowestMatrixNode = this.matrix[lowestNode.position[1]][lowestNode.position[0]];

        children.forEach(child => {
            const childKey = getKeyForPosition(child.position);

            if(visitedNodes.has(childKey)) {

                return;
            }

            if(!this.matrix[child.position[1]] || !this.matrix[child.position[1]][child.position[0]]) {

                return;
            }

            const childMatrixNode = this.matrix[child.position[1]][child.position[0]];

            if(gLimit > lowestNode.g && validatorCallback(childMatrixNode, lowestMatrixNode)) {

                if(!openNodes.has(childKey)) {

                    openNodes.set(childKey, child);
                }
            }   
        });
    }

    return null;
}

AStar.prototype.flattenTree = function(tree) {
    const walkedNodes = [];

    const walkTree = (node) => {
        walkedNodes.push(node);

        if(node.parent === null) {

            return walkedNodes;
        }

        return walkTree(node.parent);
    }

    return walkTree(tree);
}

AStar.prototype.findLowestFNode = function(openNodes) {
    const allNodes = [...openNodes.entries()];
    const lowestNode = allNodes.reduce((lowestNode, currentNode) => {
        const [lowestID, lowestElement] = lowestNode;
        const [currentID, currentElement] = currentNode;

        return currentElement.f < lowestElement.f ? currentNode : lowestNode;
    });

    return lowestNode;
}

AStar.prototype.setGoal = function(target, entityTile) {
    const matrixOffset = subVector(target, entityTile);
    const targetNode = [this.startingPosition[0] + matrixOffset[0], this.startingPosition[1] + matrixOffset[1]];

    return targetNode;
}

AStar.prototype.createNode = function(gCost, childPosition, parent) {
    const heuristic = this.manhattanDistance(childPosition);
    const fCost = gCost + heuristic;

    return new AStarNode(heuristic, gCost, fCost, childPosition, parent)
}

AStar.prototype.goalCheck = function(childPosition) {

    return childPosition[0] === this.goal[0] && childPosition[1] === this.goal[1];
}

AStar.prototype.getChildren = function(next) {
    const { g, position } = next;
    const [ x, y ] = position;
    const childGCost = g + 1;

    return [
        this.createNode(childGCost, [x, y-1], next),
        this.createNode(childGCost, [x+1, y], next),
        this.createNode(childGCost, [x, y+1], next),
        this.createNode(childGCost, [x-1, y], next)
    ];
}

AStar.prototype.manhattanDistance = function(currentPosition) {
    const X = Math.abs(this.goal[0] - currentPosition[0]);
    const Y = Math.abs(this.goal[1] - currentPosition[1]);

    return X + Y;
}

AStar.prototype.euclideanDistance = function(currentPosition) {
    const positionDifference = absoluteDifference(currentPosition, this.goal);
    const X = Math.pow(positionDifference[0], 2);
    const Y = Math.pow(positionDifference[1], 3);

    return Math.sqrt(X + Y);
}