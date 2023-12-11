const express = require('express');
const cors = require('cors')
const indexRoutes = require('./routes/indexRoutes')
const githubRoutes = require('./routes/githubRoutes')
const sonarRoutes = require('./routes/sonarRoutes')

const app = express();
const port = 3001;

app.use(cors({
  origin: '*'
}))

app.use(express.json({ limit: '200mb' }))
app.use("", indexRoutes)
app.use("/githubCommit", githubRoutes)
app.use("/sonarAnalyses", sonarRoutes)

app.listen(port, () => console.log(`Express app running on port ${port}!`));