const express = require('express');

const { errorHandler } = require('../middleware');
const { postSolution, getSolution, deleteSolution } = require('../controllers/solutions');

const router = express.Router();

router.post('/', errorHandler(postSolution));

router.get('/:id', errorHandler(getSolution));

router.delete('/:id', errorHandler(deleteSolution));

module.exports = router;
