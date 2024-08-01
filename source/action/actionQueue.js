export const ActionQueue = function() {
    this.queuedActions = [];
    this.currentAction = null;
    this.isSkippingAction = false;
    this.maxSize = 0;
}