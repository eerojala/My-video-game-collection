const bcryptjs = require('bcryptjs')
const usersRouter = require('express').Router()
const User = require('../models/user')
const { print, hashPassword } = require('../utils/controller_helper')

usersRouter.get('/', async (request, response) => {
    try {
        const users = await User.find({})

        response.json(users.map(User.format))
    } catch (exception) {
        print(exception)
        response.status(500).json({ error: 'Something went wrong...' })
    }
})

usersRouter.get('/:id', async (request, response) => {
    try {
        const user = await User.findById(request.params.id)

        if (user) {
            response.json(User.format(user))
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

usersRouter.post('/', async (request, response) => {
    try {
        const password = request.body.password

        if (!(typeof password === 'string' || password instanceof String) || password.length < 5) {
            return response.status(400).json({ error: 'Password must be a string and have atleast 5 characters' })
        }
        
        const passwordHash = await hashPassword(password)

        const user = new User({
            username: request.body.username,
            passwordHash,
            role: 'Member'
        })

        const savedUser = await user.save()

        response.json(User.format(savedUser))
    } catch (exception) {
        print(exception)

        if (exception.name === 'ValidationError' || exception.name === 'CastError' || exception.name === 'BulkWriteError') {
            response.status(400).json({ error: 'Invalid user parameters' })
        } else {
            response.status(500).json({ error: 'Something went wrong...' })
        }
    }
})

module.exports = usersRouter