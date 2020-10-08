var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('home', { title: 'Trang chủ' });
});


router.get('/contactUs', function(req, res, next) {
    res.render('contactUs', { title: 'Liên hệ' });
});

router.get('/termOfUse', function(req, res, next) {
    res.render('termOfUse', { title: 'Điều khoản' });
});

router.get('/aboutUs', function(req, res, next) {
    res.render('aboutUs', { title: 'Về chúng tôi' });
});
module.exports = router;