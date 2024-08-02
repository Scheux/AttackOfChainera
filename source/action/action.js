export const Action = function() {
    this.isFinished = false;
}

Action.prototype.onStart = function() {}

Action.prototype.onEnd = function() {}

Action.prototype.onUpdate = function(gameContext) {}

Action.prototype.isValid = function(gameContext) {}

Action.prototype.finish = function() {
    this.isFinished = true;
}