const express = require('express')
const router = express.Router()

router.get('/', (httpRequest, httpResponse) => {
    httpResponse.json({
      hello: "Dunia !"
    })
})

module.exports = router