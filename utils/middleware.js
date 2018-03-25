const logger = (request, response, next) => {
    console.log('Method: ', request.method)
    console.log('Path:   ', request.path)
    console.log('Body:   ', request.body)
    console.log('--------------')
    next()
}

const error = (request, response) => {
    response.status(404).send({ error: 'Unknown endpoint' })
}

module.exports = { logger, error }