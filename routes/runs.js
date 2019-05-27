const express = require('express');

const { errorHandler } = require('../middleware');
const { postRun, getRun } = require('../controllers/runs');

const router = express.Router();

router.get('/:id', errorHandler(getRun));

router.post('/', errorHandler(postRun));

module.exports = router;
