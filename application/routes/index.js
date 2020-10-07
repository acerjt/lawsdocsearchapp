var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('home', { title: 'Express' });
});


router.get('/contact', function(req, res, next) {
    res.render('contactUs', { title: 'Express' });
});
module.exports = router;