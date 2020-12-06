const express = require('express');
const router = express.Router();

const controller = require('../../controllers/laws/laws.controller')

router.post('/rating', controller.caculateRating);

module.exports = router;
    