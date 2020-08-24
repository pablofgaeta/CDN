let Styles = {
    blue : '#89cff0',
    white : '#ffffff',
    gray : '#9a9a9a',
    yellow : '#fdfd96',
    red : '#e19191',
    green : '#86eda6',
}
Styles.synth_cardBG = Styles.gray;
Styles.synth_cardFG = Styles.blue;

const isIterable = function(object) {
    return object != null && typeof object[Symbol.iterator] === 'function';
} 

/****** POLYFILL **********/
if (!Date.now) {
    Date.now = function() {return new Date().getTime(); };
}

/*********  EARWORM SPECIFIC ***************/

function EnsureUserID() {
    const userID = window.localStorage.getItem('ID');
    if (!userID) window.localStorage.setItem('ID', Date.now());
};

function pairCallback(val, function_hash, default_function) {
    if (function_hash.hashOwnProperty(val)) return function_hash[val]();
    else                                    return default_function();
}

function SetupRecorder() {
    let recorder = new DefaultRecorder(); 
    recordButton.enableToggleButton([
        {text : 'Record Audio', color : Styles.blue, callback : function() { recorder.record() }}
    ]);
    playButton.addEventListener('click', function() { recorder.play() });
}    

/***** PROCEDURES *********/
/**
 * Setup submission to send a POST of all $('input[type=text]') responses to a form
 * @param {String} formID - ID of the target form
 * @param {String} url - absolute or relative url path
 * @param {function} callback - (Optional) callback function with response data
 */
function SetupFormSubmission(formID, url, callback = function(data) {}) {
    document.getElementById(formID).onsubmit = function(event) {
        event.preventDefault();

        fetch(url, {
            method : 'POST',
            headers : { 'Content-Type' : 'application/json' },
            body : JSON.stringify(getFormTextData(formID))
        }).then(function(data){
            callback(data);
        });
    }
}

/******* ACCESSOR FUNCTIONS *********/

/**
 * 
 * @param {String} formID - ID of the target form
 * @param {JSON} data - Initial JSON object state to append/overwrite to
 * @returns JSON object created from all $('input[type=text]') in a form
 */
function getFormTextData(formID, data = Object.create({})) {
    document.querySelectorAll("#" + formID + " > div > input[type=text]").forEach(function(input){ data[input.name] = input.value } );
    return data;
}


/********** ELEMENT STYLES ****************/

/**
 * Sets up a scheme for iterating through any number of ordered states for a toggle button
 * @param {Array} stateList - List of objects with form {<String> Text, <String> color, <function> onclick}
 */
Element.prototype.enableToggleButton = function(stateList) {
    if (!stateList.length || stateList.length === 0) throw "invalid state list given";

    let cursor = 0;
    let numStates = stateList.length;
    this.innerHTML = stateList[cursor].text;
    this.style.backgroundColor = stateList[cursor].color;

    this.addEventListener('click', function() {
        stateList[cursor].callback();
        cursor = (cursor + 1) % numStates;
        this.innerHTML = stateList[cursor].text;
        this.style.backgroundColor = stateList[cursor].color;
    });
}
 
function InputField(titleName, initVal, validators, callback, buttonName = 'Submit', rejectCallback = function(v) {}) {
    let VALID = true;

    let validInputColor = Styles.green + 'cf';
    let invalidInputColor = Styles.red + 'cc';

    let container = document.createElement('div');
    container.className = 'flex-container-center';

    let input_container = document.createElement('div');
    input_container.className = 'flex-container-center';
    input_container.style.width = '100%';

    let title = document.createElement('div');
    title.className = 'txt-s gray base-text';
    title.width = '100%';
    title.innerHTML = titleName;

    let input = document.createElement('input');
    input.className = 'input white';
    input.style.backgroundColor = validInputColor;
    input.value = initVal;
    input.oninput = function() {
        let val = input.value.trim();
        let discovered = false;
        validators.forEach( function(regex) {
            if (regex.test(val)) {
                discovered = VALID = true;
                input.style.backgroundColor = validInputColor;
                return;
            }
        })
        if (!discovered) {
            VALID = false;
            input.style.backgroundColor = invalidInputColor;
        }
    }

    let submit = document.createElement('button');
    submit.innerHTML = buttonName;
    submit.className = 'button-l submitter';
    submit.onkeyup = input.onkeyup = function(event) {
        if (['Return', 'Enter'].includes(event.key)) {
            if (VALID) callback(input.value);
            else       rejectCallback(input.value);
        }
    };
    submit.onclick = function() { return VALID ? callback(input.value) : rejectCallback(input.value) };

    input_container.appendChild(input);
    input_container.appendChild(submit);

    container.appendChild(title);
    container.appendChild(input_container);

    return container;
}


/******** ANIMATIONS ***********/

Element.prototype.fadeOut = function(ms=1000, timing='linear', delay_ms=0) {
    let transition_str = 'opacity ' + ms + 'ms ' + timing + ' ' + delay_ms + 'ms';

    this.style.transition = transition_str;

    // triggers animation over 'ms' milliseconds;
    this.style.opacity = 0;
}

Element.prototype.fadeIn = function(ms=1000, timing='linear', delay_ms=0) {
    let transition_str = 'opacity ' + ms + 'ms ' + timing + ' ' + delay_ms + 'ms';

    this.style.transition = transition_str;

    // triggers animation over 'ms' milliseconds;
    this.style.opacity = 1;
}



/******** INCREASE SUPPORT FOR MEDIA DEVICES **********/


// Older browsers might not implement mediaDevices at all, so we set an empty object first
if (navigator.mediaDevices === undefined) {
  navigator.mediaDevices = {};
}

// Some browsers partially implement mediaDevices. We can't just assign an object
// with getUserMedia as it would overwrite existing properties.
// Here, we will just add the getUserMedia property if it's missing.
if (navigator.mediaDevices.getUserMedia === undefined) {
  navigator.mediaDevices.getUserMedia = function(constraints) {

    // First get ahold of the legacy getUserMedia, if present
    var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    // Some browsers just don't implement it - return a rejected promise with an error
    // to keep a consistent interface
    if (!getUserMedia) {
      return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
    }

    // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
    return new Promise(function(resolve, reject) {
      getUserMedia.call(navigator, constraints, resolve, reject);
    });
  }
}