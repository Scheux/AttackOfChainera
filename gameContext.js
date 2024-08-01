import { Client } from "./source/client.js";

export const GameContext = function() {
    this.client = new Client();
    this.mapLoader = null;
    this.entityLoader = null;
    this.tileHandler = null;
    this.spriteHandler = null;
}