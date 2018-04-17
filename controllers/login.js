const jwt = require('jsonwebtoken')
const bcryptjs = require('bcryptjs')
const loginRouter = require('express').Router()
const User = require('../models/user')
const print = require('../utils/print')

loginRouter.post('/', async (request, response) => {
    try {
        const body = request.body

        const user = await User.findOne({ username: body.username })

        const passwordCorrect = user === null ?
            false :
            await bcryptjs.compare(body.password, user.passwordHash)

        if (!(user && passwordCorrect)) {
            return response.status(401).send({ error: 'Invalid username or password' })
        }

        const userForToken = {
            username: user.username,
            id: user._id
        }

        const token = jwt.sign(userForToken, process.env.SECRET)

        response.status(200).send({ token, username: user.username })
    } catch (exception) {
        print(exception)

        response.status(500).send({ error: 'Something went wrong...' })
    }
})

module.exports = loginRouter