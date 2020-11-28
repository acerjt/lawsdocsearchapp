const express = require('express');
const router = express.Router();
const lawsController = require('../controllers/laws/laws.controller')
const {titles, pugFiles} = require('../common')

/* GET home page. */
router.get('/', lawsController.getLaws)

router.get('/:id', lawsController.getLawById)

router.get('/contactUs', (req, res, next) => {
    res.render(pugFiles.contactUs, { title: titles.contact });
});

router.get('/termOfUse', (req, res, next) => {
    res.render(pugFiles.termOfUse, { title: titles.policy });
});

router.get('/aboutUs', (req, res, next) => {
    res.render(pugFiles.aboutUs, { title: titles.aboutUs });
});

router.get('/profileUser', (req, res, next) => {
    res.render(pugFiles.profileUser, { title: titles.myAccount });
});

router.get('/roleChange', (req, res, next) => {
    res.render(pugFiles.roleChange, { title: titles.assignUserRole });
});

router.get('/typeUser', (req, res, next) => {
    res.render(pugFiles.typeUser, { title: titles.memberShips });
});

router.get('/admin/', function(req, res, next) {
    res.render('admin/overView', { title: 'Trang chủ' });
});

router.get('/admin/allUsers', function(req, res, next) {
    res.render('admin/allUsers', { title: 'Thành viên' });
});

router.get('/admin/allDocs', function(req, res, next) {
    res.render('admin/allDocs', { title: 'Văn bản pháp lý' });
});

module.exports = router;
