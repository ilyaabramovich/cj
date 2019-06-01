const express = require('express')

const { errorHandler } = require('../middleware')
const { postSubmission, getSubmission, deleteSubmission } = require('../controllers/submissions')

const router = express.Router()

router.post('/', errorHandler(postSubmission))

router.get('/:id', errorHandler(getSubmission))

router.delete('/:id', errorHandler(deleteSubmission))

module.exports = router
