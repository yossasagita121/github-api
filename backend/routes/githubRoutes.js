const express = require('express')
const router = express.Router()
const githubServices = require('../services/githubServices')

// router.post('/', githubServices.addCommit)
router.post('/repo', githubServices.addRepo)

module.exports = router