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

router.get('/profileUser', function(req, res, next) {
    res.render('profileUser', { title: 'Trang cá nhân' });
});

router.get('/roleChange', function(req, res, next) {
    res.render('roleChange', { title: 'Chuyển đổi' });
});

router.get('/typeUser', function(req, res, next) {
    res.render('typeUser', { title: 'Gói dịch vụ' });
});

router.get('/admin/', function(req, res, next) {
    res.render('admin/overView', { title: 'Trang chủ' });
});



module.exports = router;
