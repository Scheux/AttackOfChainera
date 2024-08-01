export const IDGenerator = function() {
  this.currentID = 0;
  this.generator = this.startGenerator();
}

IDGenerator.prototype.startGenerator = function*() {
  while (true) {
    this.currentID ++;
    const timestamp = Date.now();
    yield `id_${timestamp}_${this.currentID}`;
  }
}

IDGenerator.prototype.getID = function() {
  return this.generator.next().value;
}

IDGenerator.prototype.reset = function() {
  this.currentID = 0;
}