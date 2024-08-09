import { Cursor } from "./client/cursor.js";
import { Keyboard } from "./client/keyboard.js";
import { MusicPlayer } from "./client/musicPlayer.js";
import { SoundPlayer } from "./client/soundPlayer.js";

export const Client = function() {
    this.id = "CLIENT";
    this.keyboard = new Keyboard();
    this.cursor = new Cursor();
    this.musicPlayer = new MusicPlayer();
    this.soundPlayer = new SoundPlayer();
}

Client.prototype.update = function(gameContext) {
    this.keyboard.update(gameContext);
}