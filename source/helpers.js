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