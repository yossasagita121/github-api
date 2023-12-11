const express = require('express')
const router = express.Router()
const sonarServices = require('../services/sonarServices')

router.get('/', sonarServices.getCommitAnalyses)
router.get('/files/:commit', sonarServices.getFileAnalyses)
router.get('/analyse/repo', sonarServices.analyseRepo)

module.exports = router