export const SoundPlayer = function() {
    this.context = new AudioContext();
    this.buffers = new Map();
    this.activeSounds = new Map();
    this.soundList = null;
    this.defaultVolume = 0.3;
}

SoundPlayer.prototype.addSound = function(audioID, audio) {
    audio.isPlaying = false;
    this.buffers.set(audioID, audio);
}

SoundPlayer.prototype.clear = function() {
    this.activeSounds.forEach((sound, key) => this.stopSound(key));
    this.buffers.clear();
}

SoundPlayer.prototype.isPlaying = function(audioID) {
    if(this.buffers.has(audioID)) {
        const buffer = this.buffers.get(audioID);

        if(buffer.isPlaying) {
            return true;
        }
    }

    return false;
}

SoundPlayer.prototype.playRandom = function(idList, volume) {
    if(!idList || idList.length === 0) {
        return;
    }

    const index = Math.floor(Math.random() * idList.length);
    const bufferName = idList[index];

    if(!this.soundList.hasOwnProperty(bufferName)) {
        console.warn(`Sound ${bufferName} does not exist!`);
        return;
    }

    if(this.isPlaying(bufferName) && !this.soundList[bufferName].allowStacking) {
        const newList = idList.slice(0, index).concat(idList.slice(index + 1));
        return this.playRandom(newList, volume);
    }

    this.playSound(bufferName, volume);
}

SoundPlayer.prototype.playSound = async function(audioID, volume = this.defaultVolume) {
    if(!this.soundList.hasOwnProperty(audioID)) {
        console.warn(`Sound ${audioID} does not exist!`);
        return;
    }

    if(!this.buffers.has(audioID)) {
        await this.loadSound(audioID);
    }

    const buffer = this.buffers.get(audioID);
    const soundConfig = this.soundList[audioID];

    if(buffer.isPlaying && !soundConfig.allowStacking) {
        return;
    }

    const gainNode = this.context.createGain();
    const source = this.context.createBufferSource();

    source.connect(gainNode);
    gainNode.connect(this.context.destination);
    gainNode.gain.setValueAtTime(volume, this.context.currentTime);
    source.buffer = buffer;
    source.start(0);
    buffer.isPlaying = true;
    source.onended = () => {
        buffer.isPlaying = false;
        this.activeSounds.delete(audioID);
    }

    this.activeSounds.set(audioID, source);
}

SoundPlayer.prototype.stopSound = function(audioID) {
    if (this.activeSounds.has(audioID)) {
        const source = this.activeSounds.get(audioID);
        source.stop();
        this.activeSounds.delete(audioID);
        this.buffers.get(audioID).isPlaying = false;
    }
}

SoundPlayer.prototype.loadSound = async function(soundId) {
    const sound = this.soundList[soundId];

    if(!sound) {
        console.warn(`Sound (${soundId}) does not exist!`);
        return null;
    }

    const source = sound.directory + sound.source;

    await fetch(source)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => this.context.decodeAudioData(arrayBuffer))
    .then(decodedBuffer => this.addSound(soundId, decodedBuffer));

    return true;
}

SoundPlayer.prototype.loadAllSounds = async function() {
    const audioKeys = Object.keys(this.soundList);

    await Promise.allSettled(audioKeys.map(key => {
        const audioConfig = this.soundList[key];
        const audioSource = audioConfig.directory + audioConfig.source;
        return fetch(audioSource)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => this.context.decodeAudioData(arrayBuffer))
            .then(decodedBuffer => this.addSound(key, decodedBuffer));
    }));

    return this;
}