export const ComponentLoader = function() {
    this.components = new Map();
}

ComponentLoader.prototype.hasComponent = function(componentConstructor) {
    return this.components.has(componentConstructor);
}

ComponentLoader.prototype.addComponent = function(component) {
    this.components.set(component.constructor, component);
}

ComponentLoader.prototype.getComponent = function(componentConstructor) {
    return this.components.get(componentConstructor);
}

ComponentLoader.prototype.removeComponent = function(componentConstructor) {
    this.components.delete(componentConstructor);
}

ComponentLoader.prototype.assignData = function(assign, componentType) {
    const component = this.getComponent(componentType);

    for(const key in assign) {
        if(component.hasOwnProperty(key)) {
            component[key] = assign[key];
        } else {
            console.warn(`Property ${key} on component -${componentType}- does not exist! Continuing...`);
        }
    }
}