const express = require('express');
const router = express.Router();

const controller = require('../../controllers/laws/laws.controller')

router.post('/rating', controller.caculateRating);

router.get('/', controller.getLaws)

module.exports = router;
