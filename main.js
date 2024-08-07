import { ResourceLoader } from "./source/resourceLoader.js";
import { GameContext } from "./gameContext.js";
import { ImageSheet } from "./source/graphics/imageSheet.js";
import { MorphSystem } from "./systems/morph.js";
import { Entity } from "./source/entity/entity.js";
import { SpriteComponent } from "./components/sprite.js";

const gameContext = new GameContext();

ResourceLoader.loadConfigFiles("assets/files.json").then(async files => {
  await ResourceLoader.loadImages(files.sprites, ((key, image, config) => {
    const imageSheet = new ImageSheet(image, config);
    imageSheet.defineAnimations();
    imageSheet.defineFrames();
    files.sprites[key] = imageSheet;
  }));
  await ResourceLoader.loadImages(files.tiles, ((key, image, config) => {
    const imageSheet = new ImageSheet(image, config);
    imageSheet.defineAnimations();
    imageSheet.defineFrames();
    files.tiles[key] = imageSheet;
  }));

  return files;
}).then(async resources => {
  gameContext.loadResources(resources);
  gameContext.timer.start();
  gameContext.states.setNextState(GameContext.STATE_MAIN_MENU);
  console.log(gameContext);
});

//AFTER ENTITY MOVED -> CHECK FOR BATTLE OR SMTH.