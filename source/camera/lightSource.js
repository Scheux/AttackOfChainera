export const LightSource = function(x, y, z, intensity, [r, g, b]) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.intensity = intensity;
    this.color = [r / 255, g / 255, b / 255];
    this.epsilon = 0.001;
}

LightSource.prototype.calculateIntensity = function(pointX, pointY, pointZ) {
    const deltaX = this.x - pointX;
    const deltaY = this.y - pointY;
    const deltaZ = this.z - pointZ;

    const distanceSquared = deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ;
    const intensity = this.intensity / (distanceSquared + this.epsilon);

    return intensity;
}
