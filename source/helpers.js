import { Camera } from "./camera/camera.js";
import { Vec2 } from "./math/vec2.js";

export const toRadian = (degree) => degree * Math.PI / 180;

export const toAngle = (radian)  => radian * 180 / Math.PI;

export const normalizeAngle = (degree) => ((degree % 360) + 360) % 360;

export const getRandomNumber = (param_minVal, param_maxVal) => {
  param_maxVal -= param_minVal;
  param_maxVal++;

  let val = Math.random() * param_maxVal;
  val = Math.trunc(val);
  val += param_minVal;

  return val;
}

export const getDistance = (x1, y1, x2, y2) => Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);

export const getDistanceVec = (vec_1, vec_2) => Math.sqrt((vec_1.x - vec_2.x) ** 2 + (vec_1.y - vec_2.y) ** 2);

export const getViewportTile = function(positionVector, viewportX, viewportY) {
  const renderWidth = Camera.TILE_WIDTH;
  const renderHeight = Camera.TILE_HEIGHT;

  const tileX = Math.floor((positionVector.x / Camera.SCALE + viewportX) / renderWidth);
  const tileY = Math.floor((positionVector.y / Camera.SCALE + viewportY) / renderHeight);

  const tilePosition = new Vec2(tileX, tileY);
  
  return tilePosition;
}

export const saveTemplateAsFile = (filename, dataObjToWrite) => {
  const blob = new Blob([dataObjToWrite], { type: "text/json" });
  const link = document.createElement("a");

  link.download = filename;
  link.href = window.URL.createObjectURL(blob);
  link.dataset.downloadurl = ["text/json", link.download, link.href].join(":");

  const evt = new MouseEvent("click", {
      view: window,
      bubbles: true,
      cancelable: true,
  });

  link.dispatchEvent(evt);
  link.remove();
};

export const tileToPosition_center = function(tileX, tileY) {
  const renderWidth = Camera.TILE_WIDTH;
  const renderHeight = Camera.TILE_HEIGHT;

  const positionX = tileX * renderWidth + renderWidth / 2;
  const positionY = tileY * renderHeight + renderHeight / 2;

  const pixelPosition = new Vec2(positionX, positionY);

  return pixelPosition;
}

export const tileToPosition_corner = function(tileX, tileY) {
  const renderWidth = Camera.TILE_WIDTH;
  const renderHeight = Camera.TILE_HEIGHT;

  const positionX = tileX * renderWidth;
  const positionY = tileY * renderHeight;

  const pixelPosition = new Vec2(positionX, positionY);

  return pixelPosition;
}

export const positionToTile = function(positionX, positionY) {
  const renderWidth = Camera.TILE_WIDTH;
  const renderHeight = Camera.TILE_HEIGHT;

  const tileX = Math.trunc(positionX / renderWidth);
  const tileY = Math.trunc(positionY / renderHeight);

  const tilePosition = new Vec2(tileX, tileY);

  return tilePosition;
}