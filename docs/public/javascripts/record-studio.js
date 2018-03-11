var RecordStudio = (function () {
  var data = {
    recordings: {},
    recorder: null
  };

  function Recording(id, buffers) {
    this.id = id;
    this.buffers = buffers;

    this.play = function (audioContext, destination) {
      var newSource = audioContext.createBufferSource();
      var newBuffer = audioContext.createBuffer(2, buffers[0].length, audioContext.sampleRate );
      newBuffer.getChannelData(0).set(buffers[0]);
      newBuffer.getChannelData(1).set(buffers[1]);
      newSource.buffer = newBuffer;

      newSource.connect(destination);
      newSource.start(0);
    }
  }

  function getRecorder(destination) {
    if (!data.recorder) {
      data.recorder = new Recorder(destination);
    }
    return data.recorder;
  }

  function record(destination) {
    getRecorder(destination).record();
  }

  function pause() {
    getRecorder().stop();
  }

  function stop() {
    pause();
    getRecorder().getBuffer(function (buffers) {
      var id = generateUID();
      data.recordings[id] = new Recording(id, buffers);
      clear();
    });
  }

  function clear() {
    getRecorder().clear();
  }

  function getRecording(id) {
    return data.recordings[id];
  }

  function playRecording(id, audioContext, destination) {
    getRecording(id).play(audioContext, destination);
  }

  return {
    _data: data,
    clear: clear,
    getRecording: getRecording,
    pause: pause,
    playRecording: playRecording,
    record: record,
    stop: stop
  };
})();
