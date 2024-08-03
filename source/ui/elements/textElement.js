import { UIElement } from "../uiElement.js";

export const TextElement = function() {
    UIElement.call(this, "TEXT_ELEMENT");
    this.font = null;
    this.textAlignment = null;
    this.fillStyle = null;
    this.fullText = "";
    this.revealedText = "";
    this.timeElapsed = 0;
    this.isLooping = false;
    this.isRevealing = false;
    this.lettersPerSecond = 2;
}

TextElement.prototype = Object.create(UIElement.prototype);
TextElement.prototype.constructor = TextElement;

TextElement.TEXT_ALIGN_RIGHT = "right";
TextElement.TEXT_ALIGN_LEFT = "left";
TextElement.TEXT_ALIGN_CENTER = "center";

TextElement.prototype.setFont = function(font, alignment, fillStyle = "#000000") {
    this.font = font;
    this.textAlignment = alignment;
    this.fillStyle = fillStyle;
}

TextElement.prototype.draw = function(context, viewportX, viewportY, rootLocalX, rootLocalY) {
    const localX = rootLocalX + this.position.x;
    const localY = rootLocalY + this.position.y;
    const renderX = localX - viewportX;
    const renderY = localY - viewportY;

    this.fetch(this);

    context.save();
    context.font = this.font;
    context.fillStyle = this.fillStyle;
    context.textAlign = this.textAlignment;
    context.globalAlpha = this.opacity;
    context.textBaseline = "middle";
    context.fillText(this.revealedText, renderX, renderY);
    context.restore();

    this.drawChildren(context, viewportX, viewportY, localX, localY);
}

TextElement.prototype.setRevealSpeed = function(revealSpeed) {
    this.textRevealSpeed = revealSpeed;
}

TextElement.prototype.revealText = function() {
    this.revealedText = this.fullText;
} 

TextElement.prototype.revealLetter = function() {
    if(this.fullText.length !== this.revealedText.length) {
        this.revealedText += this.fullText[this.revealedText.length];
    }
}

TextElement.setRevealing = function(isRevealing) {
    this.isRevealing = isRevealing;
}

TextElement.prototype.setText = function(text) {
    this.fullText = text;

    if(this.isRevealing) {
        this.timeElapsed = 0;
        this.revealedText = "";
    } else {
        this.revealText();
    }
}

TextElement.prototype.receiveUpdate = function(deltaTime) {
    this.timeElapsed += deltaTime;
    const revealCount = Math.floor(this.lettersPerSecond * this.timeElapsed);

    if (revealCount > 0) {
        this.timeElapsed -= revealCount / this.lettersPerSecond;
        
        for (let i = 0; i < revealCount; i++) {
            if (this.fullText.length === this.revealedText.length) {
                if (this.isLooping) {
                    this.revealedText = "";
                } else {
                    this.timeElapsed = 0;
                }
                break;
            }
            this.revealLetter();
        }
    }
}