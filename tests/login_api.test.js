const supertest = require('supertest')
const { app, server } = require('../index')
const User = require('../models/user')
const {
    saveInitialUsers,
    user2,
    user3
} = require('../utils/test_helper')

const api = supertest(app)

describe('When the user wants to login to /api/login', async () => {
    beforeAll(async () => {
        await User.remove({})
    })

    test('they succeed if they provide correct login credentials', async () => {
        const user = Object.assign({}, user2)

        await api
            .post('/api/users')
            .send(user)
            .expect(200)

        const credentials = {
            username: user.username,
            password: user.password
        }

        const response = await api
            .post('/api/login')
            .send(credentials)
            .expect(200)
            .expect('Content-type', /application\/json/)

        expect(response.body.token).toBeTruthy()
    })

    test('they fail if the provide incorrect login credentials', async () => {
        const user = Object.assign({}, user3)

        await api
            .post('/api/users')
            .send(user)
            .expect(200)

        const credentials = {
            username: user3.username,
            password: user2.password
        }

        const response = await api
            .post('/api/login')
            .send(credentials)
            .expect(401)
            .expect('Content-type', /application\/json/)

        expect(response.body.error).toBe('Invalid username or password')
    })

    afterAll(() => {
        server.close()
    })
})