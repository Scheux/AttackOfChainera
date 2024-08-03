import { ButtonCircle } from "./button/buttonCircle.js";
import { ButtonSquare } from "./button/buttonSquare.js";
import { Icon } from "./icon.js";
import { TextElement } from "./textElement.js";
import { UIElement } from "./uiElement.js";

//TODO ADD DYNAMIC BUTTON EVENTS - UIManager.prototype.addOnClick(buttonID, callback);
//TODO ADD UNPARSING UI - UIManager.prototype.unparseUI(userInterfaceID);

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
UIManager.BUTTON_TYPE_CIRCLE = "CIRCLE";
UIManager.BUTTON_TYPE_SQUARE = "SQUARE";
UIManager.EFFECT_TYPE_FADE_IN = "FADE_IN";
UIManager.EFFECT_TYPE_FADE_OUT = "FADE_OUT";

UIManager.prototype.update = function(gameContext) {
    const { timer } = gameContext;
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

UIManager.prototype.parseText = function(element) {
    const text = new TextElement();

    text.id = element.id;
    text.DEBUG_NAME = element.id;
    text.setOpacity(element.opacity);
    text.setFont(element.font, element.align, element.color);
    text.position.x = element.position.x;
    text.position.y = element.position.y;

    if(element.text) {
        text.setText(element.text);
    }

    return text;
}

UIManager.prototype.parseButtonSquare = function(element) {
    const button = new ButtonSquare();

    button.id = element.id;
    button.DEBUG_NAME = element.id;
    button.setOpacity(element.opacity);
    button.setSize(element.width, element.height);
    button.position.x = element.position.x;
    button.position.y = element.position.y;

    return button;
}

UIManager.prototype.parseButtonCircle = function(element) {
    const button = new ButtonCircle();

    button.id = element.id;
    button.DEBUG_NAME = element.id;
    button.setOpacity(element.opacity);
    button.setRadius(element.radius);
    button.position.x = element.position.x;
    button.position.y = element.position.y;

    return button;
}

UIManager.prototype.parseElement = function(element) {
    switch(element.type) {
        case UIManager.ELEMENT_TYPE_TEXT: {
            const text = this.parseText(element);
            this.parseEffects(text, element.effects);
            this.texts.set(element.id, text);
            return text;
        }
        case UIManager.ELEMENT_TYPE_BUTTON: {
            let button = null;

            if(element.shape === UIManager.BUTTON_TYPE_CIRCLE) {
                button = this.parseButtonCircle(element);
            } else if(element.shape === UIManager.BUTTON_TYPE_SQUARE) {
                button = this.parseButtonSquare(element);
            } else {
                console.warn(`ButtonShape ${element.shape} does not exist! Returning null...`);
                return null;
            }

            this.parseEffects(button, element.effects);
            this.buttons.set(element.id, button);
            return button;
        }
        default: {
            console.warn(`UIElement ${element.type} does not exist! Returning null...`);
            return null;
        }
    }
}

UIManager.prototype.finishParsing = function(parsedElements) {
    parsedElements.forEach(({config, element}) => {
        if (!config.hasParent) {
            this.drawableElements.set(config.id, element);
        }

        if(!config.children) {
            return;
        }

        for(const childID of config.children) {
            const { config: childConfig, element: child } = parsedElements.get(childID);
            element.addChild(child, childConfig.id);
        }
    });
}

UIManager.prototype.parseUI = function(userInterfaceID) {
    if(!this.userInterfaces.hasOwnProperty(userInterfaceID)) {
        console.warn(`UserInterface ${userInterfaceID} does not exist! Returning...`);
        return;
    }

    const userInterface = this.userInterfaces[userInterfaceID];
    const parsedElements = new Map();

    for(const key in userInterface) {
        const elementConfig = userInterface[key];
        const element = this.parseElement(elementConfig);

        if(element) {
            parsedElements.set(elementConfig.id, { "config": elementConfig, "element": element });
        }
    }

    this.finishParsing(parsedElements);
}

UIManager.prototype.addOnDraw = function(textID, callback) {
    if(!this.texts.has(textID)) {
        console.warn(`Text ${textID} does not exist! Returning...`);
        return;
    }

    const text = this.texts.get(textID);
    text.onDraw = callback;
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

UIManager.prototype.addCustomElement = function(element) {
    this.customElements.set(element.id, element);
}

UIManager.prototype.removeCustomElement = function(elementID) {
    this.customElements.delete(elementID);
}

UIManager.prototype.workStart = function() {}

UIManager.prototype.workEnd = function() {
    this.customElements.clear();
    this.texts.clear();
    this.buttons.clear();
    this.icons.clear();
    this.elementsToUpdate.clear();
    this.drawableElements.clear();
}

UIManager.prototype.createIcon = function(iconID) {
    if(!this.iconTypes.hasOwnProperty(iconID)) {
        console.warn(`Icon ${iconID} does not exist! Returning...`);
        return;
    }

    const icon = new Icon();
    const image = this.iconTypes[iconID];

    icon.setImage(image);
    this.icons.set(icon.id, icon);

    return icon;
}

UIManager.prototype.createText = function(callback) {
    const text = new TextElement();

    if(callback) {
        text.onDraw = callback;
    }

    this.texts.set(text.id, text);
    return text;
}

UIManager.prototype.createCircleButton = function(callback) {
    const button = new ButtonCircle();

    if(callback) {
        button.events.subscribe(UIElement.CLICKED, "UI_MANAGER", callback);
    }

    this.buttons.set(button.id, button);   
    return button;
}

UIManager.prototype.createSquareButton = function(callback) {
    const button = new ButtonSquare();
    
    if(callback) {
        button.events.subscribe(UIElement.CLICKED, "UI_MANAGER", callback);
    }

    this.buttons.set(button.id, button);   
    return button;
}

UIManager.prototype.clickButtons = function(gameContext, mouseX, mouseY, mouseRange) {
    this.buttons.forEach(button => {
        if(button.collides(mouseX, mouseY, mouseRange)) {
            button.events.emit(UIElement.CLICKED, gameContext);
        }
    });
}

UIManager.prototype.findClickedButtons = function(mouseX, mouseY, mouseRange) {
    const clickedButtons = [];
    
    this.buttons.forEach(button => {
        if (button.collides(mouseX, mouseY, mouseRange)) {
            clickedButtons.push(button);
        }
    });

    if(clickedButtons.length === 0) {
        return null;
    }

    return clickedButtons;
}

UIManager.prototype.updateRelativePositions = function(viewportWidth, viewportHeight) {
    this.icons.forEach(icon => {
        const { relativeX, relativeY, position } = icon;

        if(relativeX !== null) {
            const positionX = Math.floor(viewportWidth * (relativeX / 100));
            position.x = positionX;
        }

        if(relativeY !== null) {
            const positionY = Math.floor(viewportHeight * (relativeY / 100));
            position.y = positionY;
        }
    });
}