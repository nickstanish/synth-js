var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Synth-JS' });
});

router.get('/webgl', function(req, res, next) {
  res.render('webgl', { title: 'Synth-JS' });
});

module.exports = router;
