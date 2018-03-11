var generateUID = (function() {
  var count = 0;
  return function () {
    return count++;
  }
})();
