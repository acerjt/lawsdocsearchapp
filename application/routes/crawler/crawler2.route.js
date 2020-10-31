const express = require('express');
const router = express.Router();

const controller = require('../../controllers/crawler/crawler2.controller')

router.get('/', controller.crawler);

module.exports = router;
