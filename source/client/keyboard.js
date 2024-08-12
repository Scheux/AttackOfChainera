import { EventEmitter } from "../events/eventEmitter.js";

export const Keyboard = function() {
    this.keys = new Set();
    this.activeKeys = new Set();

    this.addEventHandler("keydown", (event) => this.eventKeyPress(event));
    this.addEventHandler("keyup", (event) => this.eventKeyRelease(event));

    this.events = new EventEmitter();
    this.events.listen(Keyboard.KEY_PRESSED);
    this.events.listen(Keyboard.KEY_RELEASED);
    this.events.listen(Keyboard.KEY_DOWN);

    this.keys.add("w");
    this.keys.add("a");
    this.keys.add("s");
    this.keys.add("d");
    this.keys.add("b");
    this.keys.add("e");
    this.keys.add(" ");
    this.keys.add("Shift");
}

Keyboard.KEY_PRESSED = 0;
Keyboard.KEY_RELEASED = 1;
Keyboard.KEY_DOWN = 2;

Keyboard.prototype.eventKeyPress = function(event) {
    const { key } = event;

    if(!this.activeKeys.has(key)) {
        this.activeKeys.add(key);
        this.events.emit(Keyboard.KEY_PRESSED, key, this);
    }
}

Keyboard.prototype.eventKeyRelease = function(event) {
    const { key } = event;
    
    if(this.activeKeys.has(key)) {
        this.activeKeys.delete(key);
        this.events.emit(Keyboard.KEY_RELEASED, key, this);
    }
}

Keyboard.prototype.addEventHandler = function(eventType, callback) {
    document.addEventListener(eventType, (event) => {
        if(this.keys.has(event.key)) {
            event.preventDefault();
            callback(event);
        }
    });
}

Keyboard.prototype.subscribe = function(keyEvent, key, callback) {
    if(!this.keys.has(key)) {
        return;
    }

    this.events.subscribe(keyEvent, key, (keyCode, keyboard) => {
        if(keyCode === key) {
            callback(keyCode, keyboard);
        }
    });
}

Keyboard.prototype.update = function(gameContext) {
    this.activeKeys.forEach(key => this.events.emit(Keyboard.KEY_DOWN, key, this));
}