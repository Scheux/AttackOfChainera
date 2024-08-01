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
