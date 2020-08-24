let root = window.location.pathname.replace("index.html", "");
function ARSuccess()      { console.log("AR Success"); }
function ARError(err)     { navigator.notification.alert("AR Error: " + err.code); }
function ARStatus(status) { console.log("AR Status: " + Media.MEDIA_MSG[status]); }
function CreateMedia(src) { return new Media(src, ARSuccess, ARError, ARStatus); }

function AudioRecorder(name = root + 'audio/last_earworm_recording') {
    let fileTypes = {
        'browser' : '.wav',
        'iOS' : '.wav',
        'Android' : '.aac',
        'Windows' : '.m4a'
    };
    try   { this.src = name + fileTypes[device.platform]; }
    catch { throw "Platform (" + device.platform + ") not supported"; }

    this.isPlaying = false;

    try {
        this.media = CreateMedia(this.src);
        console.log("Loaded media (" + this.src + ") on " + device.platform);
    }
    catch { throw "Media could not be loaded at: " + this.src; }
    

    this.startRecord = () => {
        this.stop();
        this.media.startRecord();
    }
    this.stopRecord = () => {
        this.media.stopRecord();
    }
    this.play = () => {
        if (this.isPlaying) this.media.stop();
        this.media.play();
        this.media.setVolume(1);
        this.isPlaying = true;
    }
    this.stop = () => {
        if (this.isPlaying) this.media.stop();
        this.isPlaying = false;
    }
    this.close = () => this.media.release();
}

function DefaultRecorder() {
    this.media = null;

    this.record = () => {
        navigator.device.capture.captureAudio(
            (mediaFiles) => { this.media = CreateMedia(mediaFiles[0].fullPath) }, 
            (error) => navigator.notification.alert('Error code: ' + error.code, null, 'Capture Error'),
            {limit:1}
        );
    }

    this.play = () => {
        if (this.media) this.media.play();
    }
}