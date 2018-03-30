const gamesRouter = require('express').Router()
const Game = require('../models/game')
const Platform = require('../models/platform')

gamesRouter.get('/', async (request, response) => {
    const games = await Game
        .find({})
        .populate('platform', { __v:0, games: 0 })

    response.json(games.map(Game.format))
})

gamesRouter.get('/:id', async (request, response) => {
    try {
        const game = await Game
            .findById(request.params.id)
            .populate('platform', { __v: 0, games: 0 })

        if (game.validateSync().length === 0) {
            response.json(Game.format(game))
        } else {
            response.status(404).end()
        }
    } catch (exception) {
        console.log(exception)
        respone.status(400).send({ error: 'Malformatted id' })
    }
})

gamesRouter.post('/', async (request, response) => {
    try {
        const game = new Game(request.body)
        console.log(game)

        if (game.validateSync().length > 0) {
            response.status(400).json({ error: 'Invalid parameters' })
        }

        const platform = await Platform.findById(game.platform)

        if (!platform) {
            response.status(400).json({ error: 'Invalid platform' })
        }

        const savedGame = await game.save()

        platform.games = platform.games.concat(savedGame._id)

        await platform.save()

        response.json(Game.format(game))
    } catch (exception) {
        console.log(exception)
        response.status(500).json({ error: 'Something went wrong...' })
    }
})

gamesRouter.put('/:id', async (request, response) => {
    try {
        const body = request.body
        const newGame = {
            name: body.name,
            platform: body.platform,
            year: body.year,
            developer: body.developer,
            publisher: body.publisher
        }

        if (newGame.validateSync().length === 0) {
            const updatedGame = await Game.findByIdAndUpdate(request.params.id, newGame, { new: true })
            response.json(Game.format(updatedGame))
        } else {
            response.status(400).send({ error: 'Invalid parameters' })
        }
    } catch (exception) {
        console.log(exception)
        response.status(400).send({ error: 'Malformatted id' })
    }
})

gamesRouter.delete('/:id', async (request, response) => {
    try {
        await Game.findByIdAndRemove(request.params.id)

        response.status(204).end()
    } catch (exception) {
        response.status(400).json({ error: 'Error, something went wrong' })
    }
})

module.exports = gamesRouter