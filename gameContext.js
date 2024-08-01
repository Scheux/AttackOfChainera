import { Camera } from "./source/camera.js";
import { Client } from "./source/client.js";
import { EntityLoader } from "./source/entity/entityLoader.js";
import { MapLoader } from "./source/mapLoader.js";
import { Timer } from "./source/timer.js";

export const GameContext = function() {
    this.client = new Client();
    this.renderer = new Camera(window.innerWidth, window.innerHeight);
    this.timer = new Timer(10);
    this.mapLoader = new MapLoader({});
    this.entityLoader = new EntityLoader({});
    this.tileHandler = null;
    this.spriteHandler = null;

    this.timer.inputFunction = () => {
        this.client.update(this);
    }

    this.timer.updateFunction = () => {
        console.log("Hello at 10FPS!");
    }

    this.timer.renderFunction = () => {
        this.renderer.update(this);
    }
}

GameContext.prototype.setResources = function(resources) {
    this.resources = resources;
    this.entityLoader.entityTypes = resources.entities;
    this.mapLoader.mapConfigs = resources.maps;
}

GameContext.prototype.loadMap = function(mapID) {

}