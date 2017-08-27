
var NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
var midiNoteMap = {};
var midi = [];
for (var x = 0; x < 127; ++x) {
  var frequency = 440.0 * (Math.pow(2, ((x - 69) / 12.0)) );
  midi.push(frequency);
  midiNoteMap[x] = {
    note: NOTES[x % NOTES.length],
    frequency: frequency,
    octave: Math.floor(x / NOTES.length)
  };
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
var currentOffset = NOTES.length * 4;
var keys = [
  'Q','A','W','S','E','D','R','F','T','G','Y','H','U','J','I','K','O','L','P'
];
var keyMap = {};

function clearChildren(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

function generateKeyMap(offset) {
  var keysElement = document.getElementById('instrument-keys');
  clearChildren(keysElement);
  var keyMap = {};
  keys.forEach(function (key, i) {
    var midiNumber = i + offset;
    keyMap[key] = midiNumber;
    var isSharp = midiNoteMap[midiNumber].note.indexOf('#') >= 0;
    var noteClasses = "note";
    if (isSharp) {
      noteClasses += " note--sharp"
    }

    var node = document.createElement("div");
    node.setAttribute('class', noteClasses);
    node.setAttribute('data-key', key);
    node.setAttribute('data-note', midiNumber);
    node.addEventListener("mousedown", touchHandler.bind(null, key), false);
    node.addEventListener("mouseup", touchHandler.bind(null, key), false);
    node.addEventListener("touchstart", touchHandler.bind(null, key), false);
    node.addEventListener("touchstart", touchHandler.bind(null, key), false);
    node.addEventListener("touchmove", touchHandler.bind(null, key), false);
    node.addEventListener("touchend", touchHandler.bind(null, key), false);


    node.innerHTML =
      '<div class="note__key">' +
        '<div class="note__key-top">' +
          '<p>' + key + '</p>' +
          '<p>' + midiNumber + '</p>' +
        '</div>' +
        '<div class="note__key-bottom">' +
          '<p>' + midiNoteMap[midiNumber].note + '</p>' +
        '</div>' +
      '</div>';
    keysElement.appendChild(node);
  });
  return keyMap;
}

keyMap = generateKeyMap(currentOffset);

var leftElement = document.getElementById('instrument-keys-container__left');
var rightElement = document.getElementById('instrument-keys-container__right');
leftElement.addEventListener('click', shiftKeys.bind(null, -1));
leftElement.addEventListener('keypress', shiftKeys.bind(null, -1));
leftElement.addEventListener('mouseout', blurElement);
rightElement.addEventListener('click', shiftKeys.bind(null, 1));
rightElement.addEventListener('keypress', shiftKeys.bind(null, 1));
rightElement.addEventListener('mouseout', blurElement);

function blurElement(event) {
  event.target.blur();
}

function shiftKeys(direction, event)  {
  if (event.type === 'keypress') {
    // space or enter
    if (event.which !== 13 && event.which !== 32) {
      return;
    }
  }
  currentOffset = Math.max(0, Math.min(127 - keys.length, currentOffset + direction));
  keyMap = generateKeyMap(currentOffset);
}

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
  var note = new Note(midi[keyMap[letter]]);
  note.start();

  oldNotes[letter] = note;
  updateKeyboardNoteAppearance(oldNotes);
}

function endNote(letter) {
  if (oldNotes[letter]) {
    oldNotes[letter].stop();
    oldNotes[letter] = null;
  }
  updateKeyboardNoteAppearance(oldNotes);
}

function playMidiAuto(number, time) {
  time = time || 250;
  var note = new Note(midiNoteMap[number].frequency);
  note.start();
  window.setTimeout(function () {
    note.stop();
  }, time)
}

// playMidiSeq([60, 61, 62, null, 60, 61, 62])
function playMidiSeq(notes, time) {
  time = time || 250;
  var index = 0;
  var interval = window.setInterval(function () {
    if (notes[index] !== null) {
      playMidiAuto(notes[index], time);
    }
    if (++index >= notes.length) {
      window.clearInterval(interval);
    }
  }, time);
}

function onKeyDown(event) {
  if (event.which === 37) {
    // left arrow
    shiftKeys(-12, event);
    return;
  }
  if (event.which === 39) {
    // right arrow
    shiftKeys(12, event);
    return;
  }

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
