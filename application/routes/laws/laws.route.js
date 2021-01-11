const express = require('express');
const router = express.Router();

const controller = require('../../controllers/laws/laws.controller')

router.post('/rating', controller.caculateRating);

router.post('/autocomplete', controller.getAutocompleteDesc);

router.get('/tim-kiem', controller.searchLawsDoc);

router.get('/', controller.getLaws)

module.exports = router;
