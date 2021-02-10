const express = require('express');
const router = express.Router();

const controller = require('../../controllers/laws/laws.controller')

// router.get('/id/:id', controller.getLawById)

router.post('/rating', controller.caculateRating);

router.post('/autocomplete', controller.getAutocompleteDesc);

router.get('/tim-kiem', controller.searchLawsDoc);

router.get('/', controller.getLaws);

router.post('/autocompletedoctype', controller.getAutocompleteDocType);

router.post('/autocompletefield', controller.getAutocompleteField);

router.post('/autocompletesignedby', controller.getAutocompleteSignedBy);

router.post('/autocompleteagencyissued', controller.getAutocompleteAgencyIssued);

module.exports = router;
