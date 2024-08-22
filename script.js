let channels = [];
const numChannels = 5;
let globalVolumeSlider;
let masterGain;

function setup() {

    for (let i = 0; i < numChannels; i++) {
        initChannel(i);
    }

    const globalPlayButton = createButton('Play/Pause');
    globalPlayButton.position(1265, 700);
    globalPlayButton.mousePressed(togglePlayAll);
    globalPlayButton.class("play button");
    globalPlayButton.style("width", "150px");
    globalPlayButton.style("height", "35px");

    globalVolumeSlider = createSlider(0, 1, 0.7, 0.01); 
    globalVolumeSlider.position(1135, 330);
    globalVolumeSlider.style('width', '400px');

    globalVolumeSlider.class("mslider slider");
    globalVolumeSlider.style('rotate', '270deg');


    masterGain = getAudioContext().createGain();
    masterGain.connect(getAudioContext().destination);
    
    globalVolumeSlider.input(() => {
        let volume = globalVolumeSlider.value();
        masterGain.gain.value = volume;
        console.log(`Master Volume Set To: ${volume}`);
    });

    channels.forEach(channel => {
        channel.song.disconnect();
        channel.song.connect(masterGain);
    });
}

function initChannel(index) {
    let channel = {
        song: new p5.SoundFile(),
        highPassFilter: new p5.HighPass(),
        lowPassFilter: new p5.LowPass(),
        bandPassFilter: new p5.BandPass(),
        activeFilter: null,
        controls: {}
    };
    channels.push(channel);

    let channelContainer = createDiv('').class('channel-container');
    channelContainer.position(20 + index * 230, 20);
    channelContainer.size(180, 720);

    let fileInput = createFileInput((file) => {
        handleFile(file, channel);
    });
    fileInput.position(20 + index * 230, 700);

    fileInput.addClass("finput");
    fileInput.id("buttonid" + index);

    setupSliders(channel, index * 230, 20);
    setupButtons(channel, index * 230, 400);
}

function setupSliders(channel, x, y) {
    const spacing = 30;

    channel.controls.ampSlider = createSlider(0, 2, 1, 0.01);
    setupSlider(channel.controls.ampSlider, x + 62, y + 45, '', (val) => channel.song.amp(val), false, 120);
    channel.controls.ampSlider.class("aslider slider");

    channel.controls.volumeSlider = createSlider(0, 1, 0.7, 0.01);
    setupSlider(channel.controls.volumeSlider, x - 3, y + 527,'', (val) => channel.song.setVolume(val), true, 250);
    channel.controls.volumeSlider.class("vslider slider");

    channel.controls.panSlider = createSlider(-1, 1, 0, 0.01);
    setupSlider(channel.controls.panSlider, x + 62, y + 315, '', (val) => channel.song.pan(val), false, 120);
    channel.controls.panSlider.class("pslider slider");
}

function setupButtons(channel, x, y) {
    const buttonWidth = 80;
    const buttonHeight = 30;

    channel.controls.highPassButton = createButton('HIGH');
    channel.controls.highPassButton.position(x + 85, y - 250);
    channel.controls.highPassButton.size(buttonWidth, buttonHeight);
    channel.controls.highPassButton.mousePressed(() => toggleHighPassFilter(channel));
    channel.controls.highPassButton.class("hbutton button");

    channel.controls.lowPassButton = createButton('LOW');
    channel.controls.lowPassButton.position(x + 85, y - 170);
    channel.controls.lowPassButton.size(buttonWidth, buttonHeight);
    channel.controls.lowPassButton.mousePressed(() => toggleLowPassFilter(channel));
    channel.controls.lowPassButton.class("lbutton button");

    channel.controls.bandPassButton = createButton('BAND');
    channel.controls.bandPassButton.position(x + 85, y - 210);
    channel.controls.bandPassButton.size(buttonWidth, buttonHeight);
    channel.controls.bandPassButton.mousePressed(() => toggleBandPassFilter(channel));
    channel.controls.bandPassButton.class("bbutton button");
}

function deactivateAllFilters(channel) {
    channel.highPassFilter.freq(0);
    channel.lowPassFilter.freq(0);
    channel.bandPassFilter.freq(0);
    channel.bandPassFilter.res(0);

    channel.song.disconnect();
    channel.song.connect();

    channel.activeFilter = null;
}

function toggleHighPassFilter(channel) {
    const filterFreq = 10000;
    if (channel.activeFilter !== 'highPass') {
        deactivateAllFilters(channel);
        channel.highPassFilter.freq(filterFreq);
        channel.song.disconnect();
        channel.song.connect(channel.highPassFilter);
        channel.activeFilter = 'highPass';
        console.log('High-pass filter turned on for channel.');
    } else {
        deactivateAllFilters(channel);
        console.log('High-pass filter turned off for channel.');
    }
}

function toggleBandPassFilter(channel) {
    const filterFreq = 4750;
    const bandw = 2;
    if (channel.activeFilter !== 'bandPass') {
        deactivateAllFilters(channel);
        channel.bandPassFilter.freq(filterFreq);
        channel.bandPassFilter.res(bandw);
        channel.song.disconnect();
        channel.song.connect(channel.bandPassFilter);
        channel.activeFilter = 'bandPass';
        console.log('Band-pass filter turned on for channel.');
    } else {
        deactivateAllFilters(channel);
        console.log('Band-pass filter turned off for channel.');
    }
}

function toggleLowPassFilter(channel) {
    const filterFreq = 500;
    if (channel.activeFilter !== 'lowPass') {
        deactivateAllFilters(channel);
        channel.lowPassFilter.freq(filterFreq);
        channel.song.disconnect();
        channel.song.connect(channel.lowPassFilter);
        channel.activeFilter = 'lowPass';
        console.log('Low-pass filter turned on for channel.');
    } else {
        deactivateAllFilters(channel);
        console.log('Low-pass filter turned off for channel.');
    }
}

function setupSlider(slider, x, y, label, callback, rotate = false, sliderWidth = 20) {
    slider.position(x, y);
    slider.style('width', `${sliderWidth}px`);
    slider.style('height', '20px');
    if (rotate) {
        slider.style('transform', 'rotate(-90deg)');
    }

    slider.input(() => callback(slider.value()));
    createDiv(label).class('slider-label').position(x + 25, y + 35);
}

function handleFile(file, channel) {
    if (file.type.startsWith('audio')) {
        channel.song.stop();
        channel.song = loadSound(file.data, () => {
            console.log('Loaded new track for channel.');
            channel.song.disconnect();
            channel.song.connect(masterGain);
        }, loadError);
    } else {
        console.error('Unsupported file type.');
    }
}

function togglePlayAll() {
    let anyPlaying = channels.some(channel => channel.song.isPlaying());
    channels.forEach(channel => {
        if (anyPlaying) channel.song.stop();
        else channel.song.loop();
    });
}

function loadError(err) {
    console.error('Error loading sound:', err);
}
