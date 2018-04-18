const supertest = require('supertest')
const { app, server } = require('../index')
const User = require('../models/user')
const { saveInitialUsers } = require('../utils/test_helper')

const api = supertest(app)

describe('When the user wants to login to /api/login', async () => {
    beforeAll(async () => {
        await saveInitialUsers()
    })

    test('they succeed if they provide correct login credentials', async () => {
        const credentials = {
            username: 'notadmin',
            password: 'wordpass'
        }

        const response = await api
            .post('/api/login')
            .send(credentials)
            .expect(200)
            .expect('Content-type', /application\/json/)

        expect(response.body.token).toBeTruthy()
    })

    test('they fail if the provide incorrect login credentials', async () => {
        const credentials = {
            username: 'notadmin',
            password: 'salasana'
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