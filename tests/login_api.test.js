const supertest = require('supertest')
const { app, server } = require('../index')
const User = require('../models/user')
const {
    saveInitialUsers
} = require('../utils/test_helper')

const api = supertest(app)

describe('When the user wants to login to /api/login', async () => {
    beforeAll(async () => {
        await saveInitialUsers()
    })

    afterAll(() => {
        server.close()
    })
})