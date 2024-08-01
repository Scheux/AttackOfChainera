export const ResourceLoader = function() {
    this.DEFAULT_IMAGE_TYPE = ".png";
    this.DEFAULT_AUDIO_TYPE = ".mp3";
}

ResourceLoader.promiseImage = function(source) {
    return new Promise((resolve, reject) => {
        const image = new Image();

        image.onload = () => { 
            resolve(image);
        }

        image.onerror = () => { 
            console.error(source);
            reject(image);
        }

        image.src = source;
    });
}

ResourceLoader.loadJSON = function(filePath) {
    return fetch(filePath)
    .then(response => response.json())
    .catch(error => console.error({ filePath, error }));
}

ResourceLoader.loadAudio = function({ directory, source, isLooping }) {
    const path = directory + source;
    const audio = new Audio();

    audio.loop = isLooping;
    audio.src = path;

    return audio;
}

ResourceLoader.loadImages = function(imageList, callback) {
    const keys = Object.keys(imageList);
    
    const loadPromises = keys.map(key => {
        const { directory, source } = imageList[key];
        const imagePath = source ? `${directory}/${source}` : `${directory}/${key}${this.DEFAULT_IMAGE_TYPE}`;
        const imagePromise = ResourceLoader.promiseImage(imagePath);

        return imagePromise
        .then(image => callback(key, image, imageList[key]))
        .catch(error => console.log({ key, error }));
    });

    return Promise.allSettled(loadPromises);
}

ResourceLoader.loadFonts = function(fontList, callback) {
    const keys = Object.keys(fontList);

    const loadPromises = keys.map(key => {
        const { id, directory, source } = fontList[key];
        const fontUrl = `url(${directory}/${source})`;
        const fontFace = new FontFace(id, fontUrl);

        return fontFace.load()
        .then(font => callback(id, font, fontList[key]))
        .catch(error => console.log({ key, error }));
    });

    return Promise.allSettled(loadPromises);
}

ResourceLoader.loadConfigFiles = async function(fileListPath) {
    const files = {};
    const fileList = await ResourceLoader.loadJSON(fileListPath);
    const filePaths = Object.values(fileList).map(({ directory, source }) => `${directory}/${source}`);
    const fileLoadResults = await Promise.allSettled(filePaths.map(path => ResourceLoader.loadJSON(path)));

    Object.keys(fileList).forEach((key, index) => files[key] = fileLoadResults[index].value);

    return files;
}