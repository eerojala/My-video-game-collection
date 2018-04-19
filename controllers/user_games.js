const userGamesRouter = require('express').Router()
const UserGame = require('../models/user_game')
const User = require('../models/user')
const Game = require('../models/game')
const { print } = require('../utils/controller_helper')

userGamesRouter.get('/', async (request, response) => {
    try {
        const games = await UserGame
            .find({ user: request.params.id })
            .populate('game', { __v:0 })

        if (games) {
            response.json(games.map(Game.format))
        } else {
            response.status(404).end()
        }
    } catch (exception) {
        print(exception)

        if (exception.name === 'CastError') {
            response.status(400).json({ error: 'Malformatted user id' })
        } else {
            response.status(500).json({ error: 'Something went wrong...' })
        }
    }
})

module.exports = userGamesRouter