const gamesRouter = require('express').Router()
const Game = require('../models/game')
const Platform = require('../models/platform')
const print = require('../utils/print')

gamesRouter.get('/', async (request, response) => {
    try {
        const games = await Game
        .find({})
        .populate('platform', { name: 1 })

        response.json(games.map(Game.format))
    } catch (exception) {
        print(exception)
        response.status(500).json({ error: 'Something went wrong...' })
    }
})

gamesRouter.get('/:id', async (request, response) => {
    try {
        const game = await Game
            .findById(request.params.id)
            .populate('platform', { __v: 0, games: 0 })

        if (game) {
            response.json(Game.format(game))
        } else {
            response.status(404).end()
        }
    } catch (exception) {
        print(exception)

        if (exception.name === 'CastError') {
            response.status(400).json({ error: 'Malformatted id' })
        } else {
            response.status(500).json({ error: 'Something went wrong...' })
        }
    }
})

gamesRouter.post('/', async (request, response) => {
    try {
        const game = new Game(request.body)

        const platform = await Platform.findById(game.platform)

        if (!platform) {
            response.status(400).json({ error: 'Invalid platform' })
        }

        const savedGame = await game.save()

        platform.games = platform.games.concat(savedGame._id)

        await platform.save()

        response.json(Game.format(game))
    } catch (exception) {
        print(exception)

        if (exception.name === 'ValidationError' || exception.name === 'CastError'){
            response.status(400).json({ error: 'Invalid parameters' })
        } else {
            response.status(500).json({ error: 'Something went wrong...' })
        }
    }
})

gamesRouter.put('/:id', async (request, response) => {
    try {
        const body = request.body

        const game = await Game.findById()

        if (!game) {
            return response.status(404).json({ error: 'No game found matching id' })
        }

        const newGame = {
            name: body.name,
            platform: body.platform,
            year: body.year,
            developer: body.developer,
            publisher: body.publisher
        }

        const updatedGame = await Game.findByIdAndUpdate(request.params.id, newGame, { new: true })

        response.json(Game.format(updatedGame))
    } catch (exception) {
        print(exception)

        if (exception._message === 'Validation failed' || exception.name === 'CastError') {
            response.status(400).json({ error: 'Invalid parameters' })
        } else {
            response.status(500).json({ error: 'Something went wrong...' })
        }
    }
})

gamesRouter.delete('/:id', async (request, response) => {
    try {
        await Game.findByIdAndRemove(request.params.id)

        response.status(204).end()
    } catch (exception) {
        if (exception.name === 'CastError') {
            response.status(400).json({ error: 'Malformatted id' })
        } else {
            response.status(500).json({ error: 'Error, something went wrong' })
        }
    }
})

module.exports = gamesRouter