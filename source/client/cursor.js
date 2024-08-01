import { EventEmitter } from "../events/eventEmitter.js";
import { Vec2 } from "../math/vec2.js";

export const Cursor = function() {
    this.position = new Vec2(0, 0);
    this.radius = 0;
    this.isLocked = false;

    this.leftDragHappened = false;
    this.rightDragHappened = false;
    this.isRightMouseDown = false;
    this.isLeftMouseDown = false;
    this.rightMouseDownTime = 0;
    this.leftMouseDownTime = 0;

    this.addEventHandler("mousedown", event => this.eventMouseDown(event));
    this.addEventHandler("mouseup", event => this.eventMouseUp(event));
    this.addEventHandler("mousemove", event => this.eventMouseMove(event)); 
    this.addEventHandler("wheel", event => this.eventMouseScroll(event));   
    
    this.events = new EventEmitter();
    this.events.listen(Cursor.LEFT_MOUSE_CLICK);
    this.events.listen(Cursor.RIGHT_MOUSE_CLICK);
    this.events.listen(Cursor.LEFT_MOUSE_DRAG);
    this.events.listen(Cursor.RIGHT_MOUSE_DRAG);
    this.events.listen(Cursor.LEFT_MOUSE_UP);
    this.events.listen(Cursor.RIGHT_MOUSE_UP);
    this.events.listen(Cursor.LEFT_MOUSE_DOWN);
    this.events.listen(Cursor.RIGHT_MOUSE_DOWN);
    this.events.listen(Cursor.UP_MOUSE_SCROLL);
    this.events.listen(Cursor.DOWN_MOUSE_SCROLL);
    this.events.listen(Cursor.MOVE);
}

Cursor.DRAG_DISTANCE_THRESHOLD = 6;
Cursor.DRAG_DELAY_MILLISECONDS = 120;

Cursor.LEFT_MOUSE_CLICK = 0;
Cursor.RIGHT_MOUSE_CLICK = 1;
Cursor.LEFT_MOUSE_DRAG = 2;
Cursor.RIGHT_MOUSE_DRAG = 3;
Cursor.LEFT_MOUSE_UP = 4;
Cursor.RIGHT_MOUSE_UP = 5;
Cursor.LEFT_MOUSE_DOWN = 6;
Cursor.RIGHT_MOUSE_DOWN = 7;
Cursor.UP_MOUSE_SCROLL = 8;
Cursor.DOWN_MOUSE_SCROLL = 9;
Cursor.MOVE = 10;

Cursor.BUTTON_LEFT = 0;
Cursor.BUTTON_RIGHT = 2;

Cursor.prototype.addEventHandler = function(eventType, callback) {
    document.addEventListener(eventType, (event) => {
        event.preventDefault();
        callback(event);
    });
}

Cursor.prototype.eventMouseMove = function(event) {
    const { pageX, pageY } = event;
    const deltaX = this.isLocked ? -event.movementX : this.position.x - pageX;
    const deltaY = this.isLocked ? -event.movementY : this.position.y - pageY;

    if(this.isLeftMouseDown) {
        const elapsedTime = Date.now() - this.leftMouseDownTime;
        this.handleDrag(deltaX, deltaY, elapsedTime, Cursor.LEFT_MOUSE_DRAG);
    }

    if(this.isRightMouseDown) {
        const elapsedTime = Date.now() - this.rightMouseDownTime;
        this.handleDrag(deltaX, deltaY, elapsedTime, Cursor.RIGHT_MOUSE_DRAG);
    }

    this.position.x = pageX;
    this.position.y = pageY;
    this.events.emit(Cursor.MOVE, event, this, deltaX, deltaY);
}

Cursor.prototype.eventMouseDown = function(event) {
    const { button } = event;

    if(button === Cursor.BUTTON_LEFT) {
        this.events.emit(Cursor.LEFT_MOUSE_DOWN, event, this);
        this.isLeftMouseDown = true;
        this.leftMouseDownTime = Date.now();

    } else if(button === Cursor.BUTTON_RIGHT) {
        this.events.emit(Cursor.RIGHT_MOUSE_DOWN, event, this);
        this.isRightMouseDown = true;
        this.rightMouseDownTime = Date.now();
    }
}   

Cursor.prototype.eventMouseUp = function(event) {
    const { button } = event;

    if(button === Cursor.BUTTON_LEFT) {
        if(!this.leftDragHappened) {
            this.events.emit(Cursor.LEFT_MOUSE_CLICK, event, this);
        }

        this.events.emit(Cursor.LEFT_MOUSE_UP, event, this);
        this.isLeftMouseDown = false;
        this.leftDragHappened = false;
        this.leftMouseDownTime = 0;

    } else if(button === Cursor.BUTTON_RIGHT) {
        if(!this.rightDragHappened) {
            this.events.emit(Cursor.RIGHT_MOUSE_CLICK, event, this);
        }

        this.events.emit(Cursor.RIGHT_MOUSE_UP, event, this);
        this.isRightMouseDown = false;
        this.rightDragHappened = false;
        this.rightMouseDownTime = 0;
    }
}

Cursor.prototype.handleDrag = function(deltaX, deltaY, elapsedTime, dragEvent) {
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if(elapsedTime >= Cursor.DRAG_DELAY_MILLISECONDS || distance >= Cursor.DRAG_DISTANCE_THRESHOLD) {
        if(dragEvent === Cursor.LEFT_MOUSE_DRAG) {
            this.leftDragHappened = true;
            this.events.emit(Cursor.LEFT_MOUSE_DRAG, deltaX, deltaY);
        } else if(dragEvent === Cursor.RIGHT_MOUSE_DRAG) {
            this.rightDragHappened = true;
            this.events.emit(Cursor.RIGHT_MOUSE_DRAG, deltaX, deltaY);
        }
    }
}

Cursor.prototype.eventMouseScroll = function(event) {
    const { deltaY } = event;
    const eventID = deltaY < 0 ? Cursor.UP_MOUSE_SCROLL : Cursor.DOWN_MOUSE_SCROLL;

    this.events.emit(eventID, event, this, deltaY);
}