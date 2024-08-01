import { Cursor } from "./client/cursor.js";
import { Keyboard } from "./client/keyboard.js";

export const Client = function() {
    this.id = "CLIENT";
    this.keyboard = new Keyboard();
    this.cursor = new Cursor();
}

Client.prototype.update = function(gameContext) {
    this.keyboard.update(gameContext);
}