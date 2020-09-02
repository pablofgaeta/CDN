/******** UTILITIES   **********/
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
HTMLFormElement.prototype.SetupFormSubmission = function(url, callback = function(data) {console.log(data)}) {
    this.addEventListener('submit', (event) => {
        event.preventDefault();
        postJSON(this.getFormTextData(), url, callback);
    });
}

function postJSON(object, url, callback) {
    fetch(url, {
        method : 'POST',
        headers : { 'Content-Type' : 'application/json' },
        body : JSON.stringify(object)
    }).then(callback);
}

/******* ACCESSOR FUNCTIONS *********/

/**
 * 
 * @param {String} formID - ID of the target form
 * @param {JSON} data - Initial JSON object state to append/overwrite to
 * @returns JSON object created from all $('input[type=text]') in a form
 */
HTMLFormElement.prototype.getFormTextData = function(data = Object.create({})) {
    document.querySelectorAll("#" + this.id + " > div > input[type=text]").forEach(function(input){ data[input.name] = input.value } );
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

Element.prototype.appendInput = function(titleName='Default Title', initVal='Initial Value', type) {
    let input_container = document.createElement('div');
    input_container.className = 'flex-container flex-dir-down flex-center';
    input_container.style.width = '75%';

    let title = document.createElement('div');
    title.className = 'txt-ml white base-text';
    title.innerHTML = titleName;

    let input = document.createElement('div');
    input.role = 'textbox';
    input.contentEditable = 'true';
    input.className = 'input-l font-s black';
    input.style.backgroundColor = Styles.white;
    input.style.minHeight = '1em';
    input.style.maxHeight = '50vh';
    input.innerHTML = initVal;

    input_container.active = function(state, active_value='flex') {
        input_container.style.display = state ? active_value : 'none';
    };
    input_container.pair = function() {
        let response = {}; response[titleName] = input.innerHTML;
        return response;
    };
    input_container.response = function() { return input.innerHTML }

    this.surveyJSON = function(numInputs=this.children.length) {
        let data = {};
        for(let i=0; i<numInputs; ++i) data[i] = this.children[i].pair()
        return data;
    }

    input_container.appendChild(title);
    input_container.appendChild(input);
    this.appendChild(input_container);
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




/******** APP HANDLER **********/

const StartUpContainer = document.getElementById('startup-container');
const InputContainer   = document.getElementById('input-container');
const recordButton     = document.getElementById('record');
const playButton       = document.getElementById('play');
const CQInputs = document.getElementById('CQInputs');

let Survey = {};
Survey.default = (type) => {
    switch(type) {
        case 'number'  : return 1729;
        case 'text'    : return 'default text';
        case 'options' : return ['Hello', 'World'];
        case 'record'  : return null;
        case 'default' : throw 'SurveyPrompt type (' + type + ') not supported'
    }
}

Element.prototype.switchClass = function(removeClass, addClass) {
    this.classList.remove(removeClass);
    this.classList.add(addClass);
}

function loadQuestions(fade_ms=500) {
    StartUpContainer.style.display = 'none';
    InputContainer.style.display = 'block';
}

window.localStorage.setItem('surveyAvailable', 'true');
function loadStartupDialog() {
    let surveyAvailable = window.localStorage.getItem('surveyAvailable');
    let firstPrompt = document.getElementById('firstPrompt');

    if (surveyAvailable && surveyAvailable === 'true') {
        window.localStorage.setItem('surveyAvailable', 'true');
        firstPrompt.classList.add('bg-blue');
        firstPrompt.innerHTML = 'Touch to begin survey';
        document.body.onclick = function() {
            loadQuestions();
            document.body.onclick = function() {}; // reset callback
        }
    }
    else {
        window.localStorage.setItem('surveyAvailable', 'false');
        firstPrompt.classList.add('bg-gray');
        firstPrompt.innerHTML = 'No survey is currently available';
    }
};
loadStartupDialog();

const InputWatcher = function(container){
    this.container = container;
    this.insert = function(prompt, type) { this.container.appendInput(prompt, type); }
    Object.defineProperty(this, 'responses', {
        get() { return Array.from(container.children).map(input => input.response()) }
    });
    this.focus = function(index) {
        let inputLength = this.container.children.length;
        switch(index) {
            case 'first' : index = 0; break;
            case 'last'  : index = inputLength - 1; break;
        }
        if (index >= 0 && index < inputLength) {
            for(let i=0;i<inputLength; ++i) {
                console.log(this.container.children[i]);
                this.container.children[i].active(i == index);
            }
        }
    }
    this.submitter = document.getElementById('survey-submitter');
    this.submitter.addEventListener('click', () => {
        google.script.run.withSuccessHandler(finishSubmit).appendForm(this.responses);
        // postJSON(this.container.surveyJSON(), '/responses', console.log)
    });
};

let SurveyTaker = new InputWatcher(CQInputs);
SurveyTaker.insert("What is your study ID number?", Survey.default('number'));
SurveyTaker.insert("How are you feeling today?", Survey.default('text'));
SurveyTaker.focus(0);


function finishSubmit() {
    InputContainer.style.display = 'none';
    document.getElementById('thankyou').style.display = 'block';
}