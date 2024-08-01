export const Listener = function(type) {
    this.id = type;
    this.observers = [];
}