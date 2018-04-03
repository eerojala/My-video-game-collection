const print = require('./print')

const logger = (request, response, next) => {
    print(`Method: ${request.method}`)
    print(`Path: ${request.path}`)
    print(`Body: ${request.body}`)
    print(`--------------`)
    next()
}

const error = (request, response) => {
    response.status(404).send({ error: 'Unknown endpoint' })
}

module.exports = { logger, error }