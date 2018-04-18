const platformsRouter = require('express').Router()
const Platform = require('../models/platform')
const { print, adminLoggedIn } = require('../utils/controller_helper')

platformsRouter.get('/', async (request, response) => {
    try {
        const platforms = await Platform
            .find({})
            .populate('games', { __v: 0, platform: 0 })

        response.json(platforms.map(Platform.format))
    } catch (exception) {
        print(exception)
        response.status(500).json({ error: 'Something went wrong...' })
    }
})

platformsRouter.get('/:id', async (request, response) => {
    try {
        const platform = await Platform
            .findById(request.params.id)
            .populate('games', { __v: 0, platform: 0 })

        if (platform) {
            response.json(Platform.format(platform))
        } else {
            response.status(404).end()
        }
    } catch (exception) {
        print(exception)

        if (exception.name === 'CastError') {
            response.status(400).json({ error: 'Malformatted platform id' })
        } else {
            response.status(500).json({ error: 'Something went wrong...' })
        }
    }
})

platformsRouter.post('/', async (request, response) => {
    try {
        if (adminLoggedIn(request.token)) {
            return response.status(401).json({ error: 'Must be logged in as admin to post a new platform' })
        }

        const platform = new Platform(request.body)
        
        await platform.save()

        response.json(Platform.format(platform))
    } catch (exception) {
        print(exception)

        if (exception.name === 'ValidationError' || exception.name === 'CastError') {
            response.status(400).json({ error: 'Invalid platform parameters' })
        } else {
            response.status(500).json({ error: 'Something went wrong...' })
        }
    }
})

platformsRouter.put('/:id', async (request, response) => {
    try {
        const body = request.body

        const platform = await Platform.findById(request.params.id)

        if (!platform) {
            return response.status(404).json({ error: 'No platform found matching id' })
        }

        const newPlatform = {
            name: body.name,
            creator: body.creator,
            year: body.year,
            games: platform.games
        }

        const updatedPlatform = await Platform.findByIdAndUpdate(request.params.id, newPlatform, { new: true, runValidators: true })
        
        response.json(Platform.format(updatedPlatform))
    } catch (exception) {
        print(exception)

        if (exception._message === 'Validation failed' || exception.name === 'CastError') {
            response.status(400).json({ error: 'Invalid platform parameters' })
        } else {
            response.status(500).json({ error: 'Something went wrong...' })
        }
    }
})

platformsRouter.delete('/:id', async (request, response) => {
    try {
        const platform = await Platform.findById(request.params.id)
        
        if (platform) {
            await platform.remove()
            response.status(204).end()
        } else {
            response.status(404).json({error: 'No platform found matching id'})
        }
    } catch (exception) {
        print(exception)

        if (exception.name === 'CastError') {
            response.status(400).json({ error: 'Malformatted platform id' })
        } else {
            response.status(500).json({ error: 'Error, something went wrong' })
        }
    }
})

module.exports = platformsRouter