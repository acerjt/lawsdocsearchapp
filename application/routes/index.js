const express = require('express');
const router = express.Router();

const lawsController = require('../controllers/laws/laws.controller')
const usersRouter = require('../routes/users');
const crawler = require('../routes/crawler/crawler.route')
const lawsRouter = require('../routes/laws/laws.route')
const {titles, pugFiles} = require('../common')


router.use('/users', usersRouter);

router.use('/crawler', crawler)
router.use('/vbpl', lawsRouter)

// router.use('/vbpl', (req, res, next) => {
//     res.render(pugFiles.home, { title: titles.home });
// });
router.use('/cv', (req, res, next) => {
    res.render(pugFiles.contactUs, { title: titles.home });
});
router.use('/tcvn', (req, res, next) => {
    res.render(pugFiles.contactUs, { title: titles.home });
});
router.use('/dt', (req, res, next) => {
    res.render(pugFiles.contactUs, { title: titles.home });
});

// router.get('/', lawsController.getLaws)

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

// router.get('/:id', lawsController.getLawById)

router.get('*',function (req, res) {
    res.redirect('/vbpl');
});

module.exports = router;
