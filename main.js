import { ResourceLoader } from "./source/resourceLoader.js";
import { GameContext } from "./gameContext.js";
import { ImageSheet } from "./source/graphics/imageSheet.js";

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

//thought; entitiy goes to next map: 1. Does my current map have a neighbor in my direction? 2. Does that neighbors map_id even exist? 3. 3. was that neighbor ever loaded? 4. if not, do i collide on the neighbor map? (also load it in)
//keep a list of cachedMapIDS that also get saved. if an entity wants to walk towards a map that is not loaded or cached, 
//it checks if that maps id is in the cachedMapsList. if the id is NOT in the list, the entity can use the unloaded entity data to check if it has passing rights
//if the map is IN the cachedList, then the entity has to get everyEntity on that map (check if positionComponent.mapID === targetMapID). Then it checks if any entity on the same map
//blocks its movement

//flag: is resetting: if an entity has this flag, it gets reset once the map gets loaded again.