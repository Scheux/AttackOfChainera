export const IDGenerator = function*() {
    let currentID = 0;
    
    while (true) {
      currentID += 1;
      const timestamp = Date.now();
      yield `id_${timestamp}_${currentID}`;
    }
}