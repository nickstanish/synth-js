
var midi = [];
var a = 440; // a is 440 hz...
for (var x = 0; x < 127; ++x)
{
   midi.push( (a / 32) * (Math.pow(2, ((x - 9) / 12)) ));
}


var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

var TYPE_SQUARE = 'square';
var TYPE_TRIANGLE = 'triangle';
var TYPE_SAWTOOTH = 'sawtooth';
var TYPE_SINE = 'sine';

var soundWaveType = TYPE_SAWTOOTH;

soundTypeElement = document.getElementById('controls-wave-type');
soundTypeElement.value = soundWaveType;
soundTypeElement.addEventListener("change", function onSoundTypeChange(event) {
  var value = event.target.value;
  if ([TYPE_SAWTOOTH, TYPE_SINE, TYPE_SQUARE, TYPE_TRIANGLE].indexOf(value) >= 0) {
    soundWaveType = value;
  }
}, false);
// set options for the oscillator

function Note (frequency) {
  this.oscillator = audioCtx.createOscillator();
  this.gainNode = audioCtx.createGain();
  this.oscillator.connect(this.gainNode);
  this.gainNode.connect(audioCtx.destination);
  this.gainNode.gain.value = 0;
  this.oscillator.type = soundWaveType;
  this.oscillator.frequency.value = frequency;
}

Note.prototype.start = function () {
  var self = this;
  this.oscillator.start();
  this.start_id = window.setInterval(function () {
    self.gainNode.gain.value += 0.1;
    if (self.gainNode.gain.value >= 0.5) {
      window.clearInterval(self.start_id);
      self.gainNode.gain.value = 0.5;
      // self.stop();
    }
  }, 20);


};

Note.prototype.stop = function () {
  var self = this;
  window.clearInterval(this.start_id);
  var id = window.setInterval(function () {
    self.gainNode.gain.value -= 0.1;
    if (self.gainNode.gain.value <= 0) {
      self.gainNode.gain.value = 0;
      window.clearInterval(id);

      window.setTimeout(function() {
        self.gainNode.gain.value = 0;
        self.oscillator.stop();
        self.oscillator.disconnect();
        self.gainNode.disconnect();
        delete self.oscillator;
        delete self.gainNode;
      }, 50);
    }
  }, 20);

};


var oldNotes = {};

// Mouse pointer coordinates

var CurX;
var CurY;

// Get new mouse pointer coordinates when mouse is moved
// then set new gain and putch values

// document.onmousemove = updatePage;
var offset = 8 * 2;
var keys = [
  'Q','A','W','S','E','D','R','F','T','G','Y','H','U','J','I','K','O','L','P'
];
var keyMap = {};
var keysElement = document.getElementById('instrument-keys');
keys.map(function (key, i) {
  const note = 36 + i + offset;
  keyMap[key] = note;

  var node = document.createElement("div");
  node.setAttribute('class', 'note');
  node.setAttribute('data-key', key);
  node.setAttribute('data-note', note);
  node.addEventListener("mousedown", touchHandler.bind(null, key), false);
  node.addEventListener("mouseup", touchHandler.bind(null, key), false);
  node.addEventListener("touchstart", touchHandler.bind(null, key), false);
  node.addEventListener("touchstart", touchHandler.bind(null, key), false);
  node.addEventListener("touchmove", touchHandler.bind(null, key), false);
  node.addEventListener("touchend", touchHandler.bind(null, key), false);

  node.innerHTML = "<span>" + key + "</span>";
  keysElement.appendChild(node);
});

function updateKeyboardNoteAppearance(notes) {
  for (var note in notes) {
    var noteElement = document.querySelector('[data-key="' + note  + '"]');
    if (notes[note] !== null) {
      noteElement.classList.add('active');
    } else {
      noteElement.classList.remove('active');
    }
  }
}


document.onkeydown = onKeyDown;
document.onkeyup = onKeyUp;

function touchHandler(key, event) {
  if (event.type == "touchstart" || event.type === 'mousedown') {
    playNote(key);
  } else if (event.type === "touchmove") {
    if (oldNotes[key] !== null) {
      event.preventDefault();
    }
  } else if (event.type == "touchend" || event.type == "touchcancel" || event.type === 'mouseup') {
    endNote(key);
  }
}

function playNote(letter) {
  if (!(letter in keyMap) || oldNotes[letter]) {
    return;
  }
  console.log(letter + " - " + keyMap[letter]);
  var note = new Note(midi[keyMap[letter] + 23]);
  note.start();

  oldNotes[letter] = note;
  updateKeyboardNoteAppearance(oldNotes);
}

function endNote(letter) {
  if (oldNotes[letter]) {
    console.log(letter + " - stopping");
    oldNotes[letter].stop();
    oldNotes[letter] = null;
  }
  updateKeyboardNoteAppearance(oldNotes);
}


function onKeyDown(event) {
  var letter = String.fromCharCode(event.which);
  playNote(letter);

}
function onKeyUp(event) {
  var letter = String.fromCharCode(event.which);
  endNote(letter);

}

var previousNote = null;
function updatePage(e) {
  var WIDTH = window.innerWidth;
  var HEIGHT = window.innerHeight;

    CurX = (window.Event) ? e.pageX : event.clientX + (document.documentElement.scrollLeft ? document.documentElement.scrollLeft : document.body.scrollLeft);
    CurY = (window.Event) ? e.pageY : event.clientY + (document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop);

    // oscillator.frequency.value = (CurX/WIDTH) * maxFreq;
    // gainNode.gain.value = (CurY/HEIGHT) * maxVol;

    var note = Math.floor((CurX/WIDTH) * midi.length);

    var frequency = midi[note];

    var note = new Note(frequency);
    note.start();
    if (previousNote) {
      // previousNote.stop();
    }
    previousNote = note;


    // oscillator.type = types[Math.floor(Math.random() * 4)];

}
