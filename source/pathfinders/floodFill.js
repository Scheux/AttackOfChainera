const FloodFillNode = function(gCost, currentPositionInMatrix, parent) {
    this.g = gCost;
    this.position = currentPositionInMatrix;
    this.parent = parent;
}

export const FloodFill = function(matrix, startingPosition) {
    this.matrix = matrix;
    this.startingPosition = startingPosition;
}

FloodFill.prototype.search = function(gLimit, validatorCallback) {
    if(!gLimit || !validatorCallback) {
        return null;
    }
    
    const getMatrixNode = (position) => this.matrix[position[1]]?.[position[0]];
    const getKeyForPosition = (position) => position.join(',');
    const getFirstEntry = (map) => map.entries().next().value;

    const openNodes = new Map();
    const visitedNodes = new Map();
    const possibleNodes = [];
    const startNode = new FloodFillNode(0, this.startingPosition, null);

    openNodes.set(getKeyForPosition(startNode.position), startNode);

    while (openNodes.size !== 0) {
        const [lowestID, lowestNode] = getFirstEntry(openNodes);

        openNodes.delete(lowestID);
        visitedNodes.set(lowestID, lowestNode);

        // Use >= for proper finding.
        if(lowestNode.g > gLimit) {
            return possibleNodes;
        }

        const children = this.getChildren(lowestNode);
        const lowestMatrixNode = getMatrixNode(lowestNode.position);

        children.forEach(child => {
            const childKey = getKeyForPosition(child.position);
            const childMatrixNode = getMatrixNode(child.position);

            if(visitedNodes.has(childKey) || !childMatrixNode) {
                return;
            }

            if(validatorCallback(childMatrixNode, lowestMatrixNode)) {
                if(!openNodes.has(childKey)) {
                    childMatrixNode.tree = child;
                    openNodes.set(childKey, child);
                    possibleNodes.push(child);
                }
            }   
        });
    }

    return possibleNodes;
}

FloodFill.prototype.flattenTree = function(tree) {
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

FloodFill.prototype.getChildren = function(parent) {
    const { g, position } = parent;
    const [ x, y ] = position;
    const childGCost = g + 1;

    return [
        new FloodFillNode(childGCost, [x, y-1], parent),
        new FloodFillNode(childGCost, [x+1, y], parent),
        new FloodFillNode(childGCost, [x, y+1], parent),
        new FloodFillNode(childGCost, [x-1, y], parent)
    ];
}