const express = require('express');
const router = express.Router();
const lawsController = require('../controllers/laws/laws.controller')


/* GET home page. */
router.get('/', function(req, res, next) {
    return lawsController.getLaws(req,res).then(rs => {
        if(rs.s === 200) {
            let lawsData = rs.lawsData
            res.render('home', {
                    title: 'Trang chủ', 
                    lawsDoc: lawsData.lawsDoc && lawsData.lawsDoc.length === 0 ? [] : lawsData.lawsDoc, 
                    currentPage: lawsData.page,
                    paginateDisplayConfiguration : lawsData.paginateDisplayConfiguration
                }
            );
        }
        else res.render('home', { title: 'Trang chủ', lawsDoc : []});

    })
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


module.exports = router;
