const express = require('express');

const { errorHandler } = require('../middleware');
const { postTest, getTest, deleteTest } = require('../controllers/tests');

const router = express.Router();

router.post('/', errorHandler(postTest));

router.get('/:id', errorHandler(getTest));

router.delete('/:id', errorHandler(deleteTest));

module.exports = router;
