/**
 * Represents a light source.
 *
 * @param {number} positionX - The X-coordinate of the light source.
 * @param {number} positionY - The Y-coordinate of the light source.
 * @param {number} positionZ - The Z-coordinate of the light source.
 * @param {number} intensity - The intensity of the light source.
 * @param {Array.<number>} RGB - An array representing the RGB color components.
 * @param {number} RGB[0] r - The red component of the light color (0-255).
 * @param {number} RGB[1] g - The green component of the light color (0-255).
 * @param {number} RGB[2] b - The blue component of the light color (0-255).
 */
export const LightSource = function(positionX, positionY, positionZ, intensity, [r, g, b]) {
    this.positionX = positionX;
    this.positionY = positionY;
    this.positionZ = positionZ;
    this.intensity = intensity;
    this.color = [r / 255, g / 255, b / 255];
    this.epsilon = 0.001;
}

LightSource.prototype.calculateIntensity = function(pointX, pointY, pointZ) {
    const deltaX = this.positionX - pointX;
    const deltaY = this.positionY - pointY;
    const deltaZ = this.positionZ - pointZ;

    const distanceSquared = deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ;
    const intensity = this.intensity / (distanceSquared + this.epsilon);

    return intensity;
}
