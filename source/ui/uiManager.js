import { Camera } from "../camera/camera.js";
import { ButtonCircle } from "./elements/button/buttonCircle.js";
import { ButtonSquare } from "./elements/button/buttonSquare.js";
import { Container } from "./elements/container.js";
import { Icon } from "./elements/icon.js";
import { TextElement } from "./elements/textElement.js";
import { UIElement } from "./uiElement.js";

export const UIManager = function() {
    this.userInterfaces = {};
    this.iconTypes = {};
    this.fontTypes = {};
    this.icons = new Map();
    this.buttons = new Map();
    this.texts = new Map();
    this.containers = new Map();
    this.drawableElements = new Map();
    this.elementsToUpdate = new Map();
}

UIManager.ELEMENT_TYPE_TEXT = "TEXT";
UIManager.ELEMENT_TYPE_BUTTON = "BUTTON";
UIManager.ELEMENT_TYPE_CONTAINER = "CONTAINER";
UIManager.ELEMENT_TYPE_ICON = "ICON";
UIManager.BUTTON_TYPE_CIRCLE = "CIRCLE";
UIManager.BUTTON_TYPE_SQUARE = "SQUARE";
UIManager.EFFECT_TYPE_FADE_IN = "FADE_IN";
UIManager.EFFECT_TYPE_FADE_OUT = "FADE_OUT";

UIManager.prototype.loadFontTypes = function(fonts) {
    if(!fonts) {
        console.warn(`FontTypes cannot be undefined! Returning...`);
        return;
    }

    this.fonts = fonts;
}

UIManager.prototype.loadIconTypes = function(icons) {    
    if(!icons) {
        console.warn(`IconTypes cannot be undefined! Returning...`);
        return;
    }

    this.iconTypes = icons;
}

UIManager.prototype.loadUserInterfaceTypes = function(userInterfaces) {    
    if(!userInterfaces) {
        console.warn(`UITypes cannot be undefined! Returning...`);
        return;
    }

    this.userInterfaces = userInterfaces;
}

UIManager.prototype.workStart = function() {
    
}

UIManager.prototype.workEnd = function() {
    this.texts.clear();
    this.buttons.clear();
    this.icons.clear();
    this.elementsToUpdate.clear();
    this.drawableElements.clear();
}

UIManager.prototype.update = function(gameContext) {
    const { timer, client } = gameContext;
    const { cursor } = client;
    const deltaTime = timer.getDeltaTime();

    for(const [id, element] of this.elementsToUpdate) {
        const completedGoals = [];

        for(const [goalId, callback] of element.goals) {
            callback(element, deltaTime);

            if(element.goalsReached.has(goalId)) {
                completedGoals.push(goalId);
            }
        }

        completedGoals.forEach(goalID => {
            element.goalsReached.delete(goalID);
            element.goals.delete(goalID);
        });

        if(element.goals.size === 0) {
            this.elementsToUpdate.delete(id);
        }
    }

    for(const [key, text] of this.texts) {
        text.receiveUpdate(deltaTime);
    }

    const collidedElements = this.checkCollisions(cursor.position.x, cursor.position.y, cursor.radius);

    for(const element of collidedElements) {
        element.events.emit(UIElement.EVENT_COLLIDES);
    }
}

UIManager.prototype.checkCollisions = function(mouseX, mouseY, mouseRange) {
    const collidedElements = [];

    for(const [key, element] of this.drawableElements) {
        const isColliding = element.collides(mouseX, mouseY, mouseRange);

        if(!isColliding) {
            continue;
        }

        element.handleCollision(mouseX, mouseY, mouseRange, collidedElements);
    }

    return collidedElements;
}

//#region PARSE
UIManager.prototype.parseEffects = function(element, effects) {
    if(!effects) {
        return;
    }

    for(const effect of effects) {
        switch(effect.type) {
            case UIManager.EFFECT_TYPE_FADE_IN: {
                this.addFadeInEffect(element, effect.value, effect.threshold);
                break;
            }
            case UIManager.EFFECT_TYPE_FADE_OUT: {
                this.addFadeOutEffect(element, effect.value, effect.threshold);
                break;
            }
            default: {
                console.warn(`UIEffect ${effect.type} does not exist! Continuing...`);
            }
        }
    }
}

UIManager.prototype.parseIcon = function(config) {
    const icon = new Icon();

    icon.id = config.id;
    icon.DEBUG_NAME = config.id;
    icon.setConfig(config);
    icon.setOpacity(config.opacity);
    icon.position.x = config.position.x;
    icon.position.y = config.position.y;

    return icon;
} 

UIManager.prototype.parseText = function(config) {
    const text = new TextElement();

    text.id = config.id;
    text.DEBUG_NAME = config.id;
    text.setConfig(config);
    text.setOpacity(config.opacity);
    text.setFont(config.font, config.align, config.color);
    text.position.x = config.position.x;
    text.position.y = config.position.y;

    if(config.text) {
        text.setText(config.text);
    }

    return text;
}

UIManager.prototype.parseButtonSquare = function(config) {
    const button = new ButtonSquare();

    button.id = config.id;
    button.DEBUG_NAME = config.id;
    button.setConfig(config);
    button.setOpacity(config.opacity);
    button.setDimensions(config.width, config.height);
    button.position.x = config.position.x;
    button.position.y = config.position.y;

    return button;
}

UIManager.prototype.parseButtonCircle = function(config) {
    const button = new ButtonCircle();

    button.id = config.id;
    button.DEBUG_NAME = config.id;
    button.setConfig(config);
    button.setOpacity(config.opacity);
    button.setRadius(config.radius);
    button.position.x = config.position.x;
    button.position.y = config.position.y;

    return button;
}

UIManager.prototype.parseContainer = function(config) {
    const container = new Container();

    container.id = config.id;
    container.DEBUG_NAME = config.id;
    container.setConfig(config);
    container.setDimensions(config.width, config.height);
    container.setOpacity(config.opacity);
    container.position.x = config.position.x;
    container.position.y = config.position.y;

    return container;
}

UIManager.prototype.parseElement = function(config) {
    switch(config.type) {
        case UIManager.ELEMENT_TYPE_TEXT: {
            const text = this.parseText(config);
            this.texts.set(config.id, text);
            return text;
        }

        case UIManager.ELEMENT_TYPE_BUTTON: {
            let button = null;

            if(config.shape === UIManager.BUTTON_TYPE_CIRCLE) {
                button = this.parseButtonCircle(config);
            } else if(config.shape === UIManager.BUTTON_TYPE_SQUARE) {
                button = this.parseButtonSquare(config);
            } else {
                console.warn(`ButtonShape ${config.shape} does not exist! Returning null...`);
                return null;
            }

            this.buttons.set(config.id, button);
            return button;
        }

        case UIManager.ELEMENT_TYPE_CONTAINER: {
            const container = this.parseContainer(config);
            this.containers.set(config.id, container);
            return container;
        }

        case UIManager.ELEMENT_TYPE_ICON: {
            const icon = this.parseIcon(config);
            this.icons.set(config.id, icon);
            return icon;
        }

        default: {
            console.warn(`UIElement ${config.type} does not exist! Returning null...`);
            return null;
        }
    }
}

UIManager.prototype.parseUI = function(userInterfaceID, gameContext) {
    if(!this.userInterfaces.hasOwnProperty(userInterfaceID)) {
        console.warn(`UserInterface ${userInterfaceID} does not exist! Returning...`);
        return;
    }

    const { renderer } = gameContext;
    const children = new Set();
    const parents = new Set();
    const parsedElements = new Map();
    const userInterface = this.userInterfaces[userInterfaceID];

    for(const key in userInterface) {
        const elementConfig = userInterface[key];
        const element = this.parseElement(elementConfig);

        if(!element) {
            continue;
        }

        if(elementConfig.children) {
            for(const childID of elementConfig.children) {
                children.add(childID);
            }
            parents.add(element.id);
        }

        this.parseEffects(element, elementConfig.effects);
        parsedElements.set(element.id, {"config": elementConfig, "element": element});
    }

    for(const [key, {config, element}] of parsedElements) {
        if (!children.has(element.id)) {
            element.adjustAnchor(renderer.viewportWidth, renderer.viewportHeight);
            renderer.events.subscribe(Camera.EVENT_SCREEN_RESIZE, element.id, (width, height) => element.adjustAnchor(width, height));
            this.drawableElements.set(element.id, element);
        }

        if(!parents.has(element.id)) {
            continue;
        }

        for(const childID of config.children) {
            if(!parsedElements.has(childID)) {
                console.warn(`Child ${childID} is not loaded! Continuing...`);
                continue;
            }

            const { element: child } = parsedElements.get(childID);
            element.addChild(child, child.id);
        }
    }
}

UIManager.prototype.unparseElement = function(config) {
    switch(config.type) {
        case UIManager.ELEMENT_TYPE_TEXT: {

            if(!this.texts.has(config.id)) {
                console.warn(`Unparsing failed. Text ${config.id} does not exist! Returning...`);
                return;
            }

            this.texts.get(config.id).closeFamily();
            this.texts.delete(config.id);
            break;
        }

        case UIManager.ELEMENT_TYPE_BUTTON: {
            if(!this.buttons.has(config.id)) {
                console.warn(`Unparsing failed. Button ${config.id} does not exist! Returning...`);
                return;
            }

            this.buttons.get(config.id).closeFamily();
            this.buttons.delete(config.id);
            break;
        }

        case UIManager.ELEMENT_TYPE_CONTAINER: {
            if(!this.drawableElements.has(config.id)) {
                console.warn(`Unparsing failed. Container ${config.id} does not exist! Returning...`);
                return;
            }

            this.containers.get(config.id).closeFamily();
            this.containers.delete(config.id);
            break;
        }
    }
}

UIManager.prototype.unparseUI = function(userInterfaceID, gameContext) {
    if(!this.userInterfaces.hasOwnProperty(userInterfaceID)) {
        console.warn(`UserInterface ${userInterfaceID} does not exist! Returning...`);
        return;
    }

    const userInterface = this.userInterfaces[userInterfaceID];

    for(const key in userInterface) {
        const config = userInterface[key];

        this.unparseElement(config);

        if(this.drawableElements.has(config.id)) {
            this.drawableElements.delete(config.id);
            gameContext.renderer.events.unsubscribe(Camera.EVENT_SCREEN_RESIZE, config.id);
        }
    }
}
//#endregion PARSE
UIManager.prototype.addFetch = function(textID, callback) {
    if(!this.texts.has(textID)) {
        console.warn(`Text ${textID} does not exist! Returning...`);
        return;
    }

    this.texts.get(textID).fetch = callback;
}

UIManager.prototype.addClick = function(buttonID, callback) {
    if(!this.buttons.has(buttonID)) {
        console.warn(`Button ${buttonID} does not exist! Returning...`);
        return;
    }

    this.buttons.get(buttonID).events.subscribe(UIElement.EVENT_CLICKED, "UI_MANAGER", callback);
}

UIManager.prototype.addFadeOutEffect = function(element, fadeDecrement, fadeThreshold) {
    const id = Symbol("FadeEffect");

    const fadeFunction = (element, deltaTime) => {
        const opacity = element.opacity - (fadeDecrement * deltaTime);

        element.opacity = Math.max(opacity, fadeThreshold);
        if (element.opacity <= fadeThreshold) {
            element.goalsReached.add(id);
        }
    };

    element.goals.set(id, fadeFunction);
    this.elementsToUpdate.set(element.id, element);
}

UIManager.prototype.addFadeInEffect = function(element, fadeIncrement, fadeThreshold) {
    const id = Symbol("FadeEffect");

    const fadeFunction = (element, deltaTime) => {
        const opacity = element.opacity + (fadeIncrement * deltaTime);

        element.opacity = Math.min(opacity, fadeThreshold);
        if (element.opacity >= fadeThreshold) {
            element.goalsReached.add(id);
        }
    };

    element.goals.set(id, fadeFunction);
    this.elementsToUpdate.set(element.id, element);
}