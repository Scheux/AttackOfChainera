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