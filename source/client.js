import { MoveComponent } from "../components/move.js";
import { Cursor } from "./client/cursor.js";
import { Keyboard } from "./client/keyboard.js";
import { MusicPlayer } from "./client/musicPlayer.js";

export const Client = function() {
    this.id = "CLIENT";
    this.keyboard = new Keyboard();
    this.cursor = new Cursor();
    this.musicPlayer = new MusicPlayer();
}

Client.prototype.update = function(gameContext) {
    this.keyboard.update(gameContext);
}

Client.prototype.setupPlayerControls = function(playerEntity) {
    const moveComponent = playerEntity.components.getComponent(MoveComponent);

    this.keyboard.subscribe(Keyboard.KEY_PRESSED, "w", (event, keyboard) => moveComponent.isMovingUp = true);
    this.keyboard.subscribe(Keyboard.KEY_PRESSED, "a", (event, keyboard) => moveComponent.isMovingLeft = true);
    this.keyboard.subscribe(Keyboard.KEY_PRESSED, "s", (event, keyboard) => moveComponent.isMovingDown = true);
    this.keyboard.subscribe(Keyboard.KEY_PRESSED, "d", (event, keyboard) => moveComponent.isMovingRight = true);
    this.keyboard.subscribe(Keyboard.KEY_PRESSED, "b", (event, keyboard) => {
        if(!moveComponent.hasBoots) {
            moveComponent.isRunning = !moveComponent.isRunning;
        }
    });
    
    this.keyboard.subscribe(Keyboard.KEY_RELEASED, "w", (event, keyboard) => moveComponent.isMovingUp = false);
    this.keyboard.subscribe(Keyboard.KEY_RELEASED, "a", (event, keyboard) => moveComponent.isMovingLeft = false);
    this.keyboard.subscribe(Keyboard.KEY_RELEASED, "s", (event, keyboard) => moveComponent.isMovingDown = false);
    this.keyboard.subscribe(Keyboard.KEY_RELEASED, "d", (event, keyboard) => moveComponent.isMovingRight = false);
}