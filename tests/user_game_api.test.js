const supertest = require('supertest')
const { app, server } = require('../index')
const UserGame = require('../models/user_game')
const User = require('../models/user')
const {
    initializeTestDb,
    userGamesInDb
} = require('../utils/test_helper')

const api = superTest(app)

describe('When there are initially some user games saved', async () => {
    beforeAll(async () => {
        await initializeTestSb()
    })
})