import { ResourceLoader } from "../resourceLoader.js";

export const MusicPlayer = function() {
    this.tracks = new Map();
    this.currentTack = null;
    this.previousTrack = null;
    this.musicList = null;
    this.volume = 0.5;
}

MusicPlayer.prototype.loadMusicTypes = function(musicTypes) {
    if(!musicTypes) {
        console.warn(`MusicTypes cannot be undefined! Returning...`);
        return;
    }

    this.musicList = musicTypes;
}

MusicPlayer.prototype.swapTrack = function(audioID, volume = this.volume) {
    if(!this.tracks.has(audioID) || this.currentTack === audioID) {
        console.warn(`Music ${audioID} does not exist or is not loaded! Returning...`);
        return false;
    }

    this.resetTrack(this.currentTack);
    this.playTrack(audioID, volume);
}

MusicPlayer.prototype.loadAllTracks = function() {
    for(const key in this.musicList) {
        this.loadTrack(key);
    }
}

MusicPlayer.prototype.loadTrack = function(audioID) {
    if(!this.musicList[audioID]) {
        console.warn(`Music ${audioID} does not exist! Returning...`);
        return;
    }

    if(this.tracks.has(audioID)) {
        console.warn(`Music ${audioID} is already loaded! Returning...`);
        return;
    }

    const config = this.musicList[audioID];
    const audio = ResourceLoader.loadAudio(config);

    this.tracks.set(audioID, audio);
}

MusicPlayer.prototype.playTrack = function(audioID = this.currentTack, volume = this.volume) {
    if(!this.tracks.has(audioID)) {
        console.warn(`Music ${audioID} does not exist! Returning...`);
        return;
    }

    const audio = this.tracks.get(audioID);

    if(audio.paused) {
        if(audioID !== this.currentTack) {
            this.previousTrack = this.currentTack;
        }
        this.currentTack = audioID;
        audio.volume = volume;
        audio.play();
    }
}

MusicPlayer.prototype.pauseTrack = function(audioID = this.currentTack) {
    if(!this.tracks.has(audioID)) {
        console.warn(`Music ${audioID} does not exist! Returning...`);
        return;
    }

    const audio = this.tracks.get(audioID);
    audio.pause();
}

MusicPlayer.prototype.resetTrack = function(audioID = this.currentTack) {
    if(!this.tracks.has(audioID)) {
        console.warn(`Music ${audioID} does not exist! Returning...`);
        return;
    }

    const audio = this.tracks.get(audioID);
    audio.currentTime = 0;
    audio.pause();
}

MusicPlayer.prototype.clear = function() {
    this.tracks.forEach((value, key) => this.resetTrack(key));
    this.tracks.clear();
}

MusicPlayer.prototype.setVolume = function(volume = this.volume, audioID = this.currentTack) {
    if(!this.tracks.has(audioID)) {
        console.warn(`Music ${audioID} does not exist! Returning...`);
        return;
    }

    const audio = this.tracks.get(audioID);
    audio.volume = volume;
}

MusicPlayer.prototype.adjustPlayerVolume = function(byValue) {
    if(this.volume + byValue > 1) {
        this.volume = 1;
    } else if(this.volume + byValue < 0) {
        this.volume = 0;
    } else {
        this.volume += byValue;
    }
}

MusicPlayer.prototype.adjustVolume = function(byValue, audioID = this.currentTack) {
    this.adjustPlayerVolume(byValue);

    if(!this.tracks.has(audioID)) {
        console.warn(`Music ${audioID} does not exist! Returning...`);
        return;
    }

    const audio = this.tracks.get(audioID);
    audio.volume = this.volume;
}