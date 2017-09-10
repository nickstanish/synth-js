
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

var INITIAL_COMPRESSION_ENABLED = true;
var MIN_GAIN = 0;
var INITIAL_GAIN = 0.5;
var MAX_GAIN = 1;
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

var noteDestination = audioCtx.createGain();
noteDestination.gain.value = 1;

var destinationGainNode = audioCtx.createGain();
destinationGainNode.gain.value = INITIAL_GAIN;
destinationGainNode.connect(audioCtx.destination);

var compressor = audioCtx.createDynamicsCompressor();
compressor.threshold.value = -30;
compressor.knee.value = 40;
compressor.ratio.value = 10;
compressor.attack.value = 0;
compressor.release.value = 0.25;

if (INITIAL_COMPRESSION_ENABLED) {
  noteDestination.connect(compressor);
  compressor.connect(destinationGainNode);
} else {
  noteDestination.connect(destinationGainNode);
}

var volumeElement = document.getElementById('controls-volume');
volumeElement.value = INITIAL_GAIN;
volumeElement.addEventListener("change", function onVolumeChange(event) {
  var value = event.target.value;
  destinationGainNode.gain.value = Math.max(Math.min(parseFloat(value), MAX_GAIN), MIN_GAIN);
}, false);

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

compressionElement = document.getElementById('controls-enable-compression');
compressionElement.checked = INITIAL_COMPRESSION_ENABLED;
compressionElement.addEventListener("change", function onCompressionEnabledChanged(event) {
  var value = event.target.checked;
  noteDestination.disconnect();
  if (value) {
    noteDestination.connect(compressor);
    compressor.connect(destinationGainNode);
  } else {
    compressor.disconnect();
    noteDestination.connect(destinationGainNode);
  }
}, false);


// set options for the oscillator
var NOTE_ATTACK_GAIN = 0.8;
var NOTE_ATTACK_TIME_MS = 100;
var NOTE_ATTACK_STEPS = 10.0;

var NOTE_DECAY_TIME_MS = 180;
var NOTE_DECAY_GAIN = 0;
var NOTE_DECAY_STEPS = 10.0;

function Note (frequency) {
  this.oscillator = audioCtx.createOscillator();
  this.gainNode = audioCtx.createGain();
  this.oscillator.connect(this.gainNode);
  this.gainNode.connect(noteDestination);
  this.gainNode.gain.value = 0;
  this.oscillator.type = soundWaveType;
  this.oscillator.frequency.value = frequency;
}

Note.prototype.start = function () {
  var delta = (NOTE_ATTACK_GAIN - NOTE_DECAY_GAIN) / NOTE_ATTACK_STEPS;
  var self = this;
  this.oscillator.start();
  this.start_id = window.setInterval(function () {
    self.gainNode.gain.value += delta;
    if (self.gainNode.gain.value >= NOTE_ATTACK_GAIN) {
      window.clearInterval(self.start_id);
      self.gainNode.gain.value = NOTE_ATTACK_GAIN;
    }
  }, NOTE_ATTACK_TIME_MS / NOTE_ATTACK_STEPS);
};

Note.prototype.stop = function () {
  var self = this;
  window.clearInterval(this.start_id);
  var id = window.setInterval(function () {
    var delta = (NOTE_DECAY_GAIN - NOTE_ATTACK_GAIN) / NOTE_DECAY_STEPS;
    self.gainNode.gain.value += delta;
    if (self.gainNode.gain.value <= NOTE_DECAY_GAIN) {
      self.gainNode.gain.value = NOTE_DECAY_GAIN;
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
  }, NOTE_DECAY_TIME_MS / NOTE_DECAY_STEPS);
};


var oldNotes = {};

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
