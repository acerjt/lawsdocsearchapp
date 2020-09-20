const express = require('express');
const router = express.Router();

const controller = require('../../controllers/crawler/crawler.controller')

router.get('/', controller.crawler);

module.exports = router;
