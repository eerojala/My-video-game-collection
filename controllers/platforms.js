const platformsRouter = require('express').Router()
const Platform = require('../models/platform')

platformsRouter.get('/', async (request, response) => {
    const platforms = await Platform
        .find({})
        .populate('games', { __v: 0, platform: 0 })

    response.json(platforms.map(Platform.format))
})

platformsRouter.get('/:id', async (request, response) => {
    try {
        const platform = await Platform
            .findById(request.params.id)
            .populate('games', { _v: 0, platform: 0 })

        if (platform) {
            response.json(Platform.format(platform))
        } else {
            response.status(404).end()
        }
    } catch (exception) {
        console.log(exception)
        response.status(400).send({ error: 'Malformatted id' })
    }
})

platformsRouter.post('/', async (request, response) => {
    try {
        const platform = new Platform(request.body)

        if (platform.validateSync().length > 0) {
            console.log(platform)
            return response.status(404).json({ error: 'Invalid parameters' })
        }

        await platform.save()

        response.json(Platform.format(platform))
    } catch (exception) {
        console.log(exception)
        response.status(500).json({ error: 'Something went wrong...' })
    }
})

platformsRouter.put('/:id', async (request, response) => {
    try {
        const body = request.body
        const platform = await Platform.findById(request.params.id)

        if (!platform) {
            response.status(404).end()
        }

        const newPlatform = {
            name: body.name,
            creator: body.creator,
            year: body.year,
            games: platform.games
        }

        if (newPlatform.validateSync().length === 0) {
            const updatedPlatform = await Platform.findByIdAndUpdate(request.params.id, newPlatform, { new: true })
            response.json(Platform.format(updatedPlatform))
        } else {
            response.status(400).send({ error: 'Invalid parameters' })
        }
    } catch (exception) {
        console.log(exception)
        response.status(400).send({ error: 'Malformatted id' })
    }
})

platformsRouter.delete(':/id', async (request, response) => {
    try {
        await Platform.findByIdAndRemove(request.params.id)

        response.status(204).end()
    } catch (exception) {
        response.status(400).json({ error: 'Error, something went wrong' })
    }
})

module.exports = platformsRouter