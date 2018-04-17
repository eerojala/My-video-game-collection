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

const tokenExtractor = (request, response, next) => {
    const authorization = request.get('authorization')

    if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
        request.token = authorization.substring(7)
    }

    next()
}

module.exports = { 
    logger, 
    error,
    tokenExtractor 
}