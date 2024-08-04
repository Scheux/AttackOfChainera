export const Family = function(reference) {
    this.id = Symbol("FAMILY");
    this.customName = null;
    this.parent = null;
    this.children = [];
    this.reference = reference;
}

Family.prototype.setCustomName = function(customName) {
    if(customName === undefined) {
        console.warn(`Family with no customName has been opened! Setting customName to null! Returning...`);
        this.customName = null;
        return;
    }

    this.customName = customName;
}

Family.prototype.setParent = function(member) {
    if(member.id === this.id) {
        console.warn(`Cannot be own parent! Returning...`);
        return;
    }

    if(this.parent !== null) {
        this.parent.removeChild(this);
    }

    this.parent = member;

    if (member && !member.hasChild(this)) {
        member.addChild(this);
    }
}

Family.prototype.hasChild = function(member) {
    return this.children.some(child => child.id === member.id || child.customName && member.customName ? child.customName === member.customName : false);
}

Family.prototype.addChild = function(member, zIndex = this.children.length) {
    if(member.id === this.id) {
        console.warn(`Cannot be own child! Returning...`);
        return;
    }

    if(this.hasChild(member)) {
        return;
    }

    this.children.splice(zIndex, 0, member);
    member.setParent(this);
}

Family.prototype.removeChild = function(member) {
    const index = this.children.findIndex(child => child.id === member.id);

    if (index !== -1) {
        this.children.splice(index, 1);
        member.parent = null;
    }
}

Family.prototype.getChildByName = function(name) {
    return this.children.find(child => child.customName ? child.customName === name : false) || null;
}

Family.prototype.getChild = function(member) {
    return this.children.find(child => child.id === member.id) || null;
}

Family.prototype.getParent = function() {
    return this.parent;
}

Family.prototype.getAllChildren = function() {
    return this.children;
}

Family.prototype.getReference = function() {
    return this.reference;
}

Family.prototype.onRemove = function() {
    if(this.parent !== null) {
        this.parent.removeChild(this);
    }

    this.children.forEach(child => {
        this.removeChild(child);
    });

    this.children = [];
    this.parent = null;
}
