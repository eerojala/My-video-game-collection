const defaultRouter = require('express').Router()

defaultRouter.get('/*', (request, response) => {
    response.redirect('/')
})

module.exports = defaultRouter