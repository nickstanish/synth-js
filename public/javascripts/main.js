
var midi = [];
var a = 440; // a is 440 hz...
for (var x = 0; x < 127; ++x)
{
   midi.push( (a / 32) * (Math.pow(2, ((x - 9) / 12)) ));
}


var audioCtx = new (window.AudioContext || window.webkitAudioContext)();




// set options for the oscillator

function Note (frequency) {
  this.oscillator = audioCtx.createOscillator();
  this.gainNode = audioCtx.createGain();
  this.oscillator.connect(this.gainNode);
  this.gainNode.connect(audioCtx.destination);
  this.gainNode.gain.value = 0;
  this.oscillator.type = 'square'; // sine wave — other values are 'square', 'sawtooth', 'triangle' and 'custom'
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


// Mouse pointer coordinates

var CurX;
var CurY;

// Get new mouse pointer coordinates when mouse is moved
// then set new gain and putch values

// document.onmousemove = updatePage;
var keyMap = {
  A: 36,
  S: 37,
  D: 38,
  F: 39,
  G: 40,
  H: 41,
  I: 42,
  J: 43,
  K: 44,
  O: 45,
  L: 46,
  P: 47
};

document.onkeydown = onKeyDown;
document.onkeyup = onKeyUp;

var oldNotes = {};

function onKeyDown(event) {
  var letter = String.fromCharCode(event.which);
  if (!(letter in keyMap) || oldNotes[letter]) {
    return;
  }
  console.log(letter + " - " + keyMap[letter]);
  var note = new Note(midi[keyMap[letter] + 23]);
  note.start();

  oldNotes[letter] = note;
}
function onKeyUp(event) {
  var letter = String.fromCharCode(event.which);
  if (oldNotes[letter]) {
    console.log(letter + " - stopping");
    oldNotes[letter].stop();
    oldNotes[letter] = null;
  }
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