const http = require('http')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const mongoose = require('mongoose')

const middleware = require('./utils/middleware')
const platformsRouter = require('./controllers/platforms')
const gamesRouter = require('./controllers/games')
const usersRouter = require('./controllers/users')
const userGamesRouter = require('./controllers/user_games')
const loginRouter = require('./controllers/login')
const defaultRouter = require('./controllers/default')

const app = express()
const config = require('./utils/config')

mongoose
  .connect(config.mongoUrl)
  .then(() => {
    console.log('Connected to database')
  })
  .catch(error => {
    console.log(error)
  })

mongoose.Promise = global.Promise

// Middleware
app.use(cors())
app.use(bodyParser.json())
app.use(express.static('build'))
app.use(middleware.logger)
app.use(middleware.tokenExtractor)

// Controllers
app.use('/api/platforms', platformsRouter)
app.use('/api/games', gamesRouter)
app.use('/api/users', usersRouter)
app.use('/api/usergames', userGamesRouter)
app.use('/api/login', loginRouter)
app.use('/', defaultRouter)

// Error middleware
app.use(middleware.error)

const server = http.createServer(app)

server.listen(config.port, () => {
  console.log(`Server running of port ${config.port}`)
})

server.on('close', () => {
  mongoose.connection.close()
})

module.exports = {
  app, server
}