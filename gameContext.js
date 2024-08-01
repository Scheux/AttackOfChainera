import { Camera } from "./source/camera.js";
import { Client } from "./source/client.js";
import { EntityLoader } from "./source/entity/entityLoader.js";
import { Timer } from "./source/timer.js";

export const GameContext = function() {
    this.client = new Client();
    this.renderer = new Camera(window.innerWidth, window.innerHeight);
    this.timer = new Timer();
    this.mapLoader = null;
    this.entityLoader = new EntityLoader({});
    this.tileHandler = null;
    this.spriteHandler = null;

    this.timer.inputFunction = () => {
        this.client.update(this);
    }

    this.timer.updateFunction = () => {
        console.log("hi");
    }

    this.timer.renderFunction = () => {
        this.renderer.update(this);
    }
}

GameContext.prototype.setResources = function(resources) {
    this.resources = resources;
    this.entityLoader.entityTypes = resources.entities;
}