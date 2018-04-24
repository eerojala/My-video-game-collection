const userGamesRouter = require('express').Router()
const UserGame = require('../models/user_game')
const User = require('../models/user')
const Game = require('../models/game')
const { print, correctUserLoggedIn } = require('../utils/controller_helper')

userGamesRouter.get('/', async (request, response) => {
    try {
        const user = await User.findById(request.params.userId)
        console.log(request.params)
        if (!user) {
            return response.status(404).json({ error: 'No user found matching given user id' })
        }

        const games = await UserGame
            .find({ user: request.params.userId })
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

userGamesRouter.post('/', async (request, response) => {
    try {
        if (await correctUserLoggedIn(request.token) === false) {
            return response.status(401).json({ error: 'Must be logged in as a user with a corresponding id' })
        }

        const game = await Game.findById(body.game)

        if (!game) {
            return response.status(400).json({ error: 'No game found matching given game id' })
        }

        const userGame = Object.assign({user: request.params.userId}, request.body)
        const newUserGame = new User(userGame)

        const savedUserGame = await newUserGame.save()
        const user = await User.findById(request.params.userId)

        user.games = user.games.concat(savedUserGame._id)

        await user.save()

        response.json(UserGame.format(savedUserGame))
    } catch (exception) {
        print(exception)

        if (exception.name === 'ValidationError' || exception.name === 'CastError'){
            response.status(400).json({ error: 'Invalid game parameters' })
        } else {
            response.status(500).json({ error: 'Something went wrong...' })
        }
    }
})

userGamesRouter.put('/:userGameId', async (request, response) => {
    try {
        if (await correctUserLoggedIn(request.token) === false) {
            return response.status(401).json({ error: 'Must be logged in as a user with a corresponding id' })
        }

        const userGame = await UserGame.findById(request.params.userGameId)

        if (!userGame) {
            return response.status(404).json({ error: 'No user game found matching id' })
        }

        const changesToUserGame = Object.assign({}, request.body)

        const updatedUserGame = await UserGame.findByIdAndUpdate(request.params.userId, changesToUserGame, { new: true, runValidators: true })

    } catch (exception) {
        print(exception)

        if (exception._message === 'Validation failed' || exception.name === 'CastError') {
            response.status(400).json({ error: 'Invalid game parameters' })
        } else {
            response.status(500).json({ error: 'Something went wrong...' })
        }
    }
})

userGamesRouter.delete('/:userGameId', async (request, response) => {
    try {
        if (await correctUserLoggedIn(request.token) === false) {
            return response.status(401).json({ error: 'Must be logged in as a user with a corresponding id' })
        }

        const userGame = await UserGame.findByIdAndRemove(request.params.userGameId)

        if (!userGame) {
            return response.status(404).json({ error: 'No user game found matching id' })
        }

        const user = await User.findById(request.params.userId)

        user.games = user.games.filter(game => JSON.stringify(game) !== JSON.stringify(request.params.userGameId))

        await User.findByIdAndUpdate(user.id, user, { new: true, runValidators: true })

        response.status(204).end()
    } catch (exception) {
        print(exception)

        if (exception.name === 'CastError') {
            response.status(400).json({ error: 'Malformatted id' })
        } else {
            response.status(500).json({ error: 'Error, something went wrong' })
        }
    }
})

module.exports = userGamesRouter