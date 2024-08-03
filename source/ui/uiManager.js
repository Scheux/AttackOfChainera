import { Camera } from "../camera/camera.js";
import { ButtonCircle } from "./elements/button/buttonCircle.js";
import { ButtonSquare } from "./elements/button/buttonSquare.js";
import { TextElement } from "./elements/textElement.js";
import { UIElement } from "./uiElement.js";

export const UIManager = function() {
    this.userInterfaces = {};
    this.iconTypes = {};
    this.fontTypes = {};
    this.icons = new Map();
    this.buttons = new Map();
    this.texts = new Map();
    this.customElements = new Map();
    this.drawableElements = new Map();
    this.elementsToUpdate = new Map();
}

UIManager.ELEMENT_TYPE_TEXT = "TEXT";
UIManager.ELEMENT_TYPE_BUTTON = "BUTTON";
UIManager.ELEMENT_TYPE_CONTAINER = "CONTAINER";
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
    this.customElements.clear();
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

    for(const [key, element] of this.drawableElements) {
        const isColliding = element.collides(cursor.position.x, cursor.position.y, cursor.radius);
        element.highlight(false);

        if(isColliding) {
            element.highlight(true);
        }
    }

    for(const [key, element] of this.texts) {
        element.receiveUpdate(deltaTime);
    }
}

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
    button.setSize(config.width, config.height);
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

UIManager.prototype.parseElement = function(config) {
    switch(config.type) {
        case UIManager.ELEMENT_TYPE_TEXT: {
            const text = this.parseText(config);
            this.texts.set(text.id, text);
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

            this.buttons.set(button.id, button);
            return button;
        }

        default: {
            console.warn(`UIElement ${config.type} does not exist! Returning null...`);
            return null;
        }
    }
}

UIManager.prototype.parseUI = function(userInterfaceID, gameContext) {
    const { renderer } = gameContext;

    if(!this.userInterfaces.hasOwnProperty(userInterfaceID)) {
        console.warn(`UserInterface ${userInterfaceID} does not exist! Returning...`);
        return;
    }

    const children = new Set();
    const parents = new Set();
    const parsedElements = new Map();
    const userInterface = this.userInterfaces[userInterfaceID];

    for(const key in userInterface) {
        const elementConfig = userInterface[key];
        const element = this.parseElement(elementConfig);

        if(element) {
            if(elementConfig.children) {
                for(const childID of elementConfig.children) {
                    children.add(childID);
                }
                parents.add(element.id);
            }

            this.parseEffects(element, elementConfig.effects);
            parsedElements.set(element.id, {"config": elementConfig, "element": element});
        }
    }

    for(const [key, {config, element}] of parsedElements) {
        if (!children.has(element.id)) {
            element.adjustAnchor(renderer.viewportWidth, renderer.viewportHeight);
            renderer.events.subscribe(Camera.EVENT_SCREEN_RESIZE, element.id, (width, height) => element.adjustAnchor(width, height));
            this.drawableElements.set(element.id, element);
        }

        if(parents.has(element.id)) {
            for(const childID of config.children) {
                const { element: child } = parsedElements.get(childID);
                element.addChild(child, child.id);
            }
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
        const element = userInterface[key];

        switch(element.type) {
            case UIManager.ELEMENT_TYPE_TEXT: {
                this.texts.delete(element.id);
                break;
            }
            case UIManager.ELEMENT_TYPE_BUTTON: {
                this.buttons.delete(element.id);
                break;
            }
            case UIManager.ELEMENT_TYPE_CONTAINER: {
                break;
            }
        }

        if(this.drawableElements.has(element.id)) {
            this.drawableElements.delete(element.id);
            gameContext.renderer.events.unsubscribe(Camera.EVENT_SCREEN_RESIZE, element.id);
        }
    }
}

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

    this.buttons.get(buttonID).events.subscribe(UIElement.EVENT_CLICKED, "UI_MANAGER", (gameContext, button) => callback(gameContext, button));
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

UIManager.prototype.addCustomElement = function(element) {
    this.customElements.set(element.id, element);
}

UIManager.prototype.removeCustomElement = function(elementID) {
    this.customElements.delete(elementID);
}

UIManager.prototype.findClickedButtons = function(mouseX, mouseY, mouseRange) {
    const clickedButtons = [];
    
    this.buttons.forEach(button => {
        if (button.collides(mouseX, mouseY, mouseRange)) {
            clickedButtons.push(button);
        }
    });

    return clickedButtons;
}