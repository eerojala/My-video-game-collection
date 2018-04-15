const supertest = require('supertest')
const { app, server } = require('../index')
const User = require('../models/user')
const {
    saveInitialUsers,
    usersInDb
} = require('../utils/test_helper')

const api = supertest(app)

describe('When there are initially some users saved', async () => {
    beforeAll(async () => {
        await saveInitialUsers()
    })

    test('all users are returned as JSON by GET /api/platforms', async () => {
        const users = await usersInDb()

        const response = await api
            .get('/api/users')
            .expect(200)
            .expect('Content-type', /application\/json/)

        const body = response.body
        const ids = body.map(user => user.id)
        const usernames = body.map(user => user.username)
        const roles = body.map(user => user.role)

        expect(body).toHaveLength(users.length)
        users.forEach(user => {
            expect(ids).toContain(user.id),
            expect(usernames).toContain(user.username),
            expect(roles).toContain(user.role)
        })
    })

    afterAll(() => {
        server.close()
    })
})