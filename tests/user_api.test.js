const supertest = require('supertest')
const { app, server } = require('../index')
const User = require('../models/user')
const {
    saveInitialUsers,
    usersInDb,
    nonExistingId
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

    describe('GET /api/users/:id', async () => {
        test('returns an individual user as JSON', async () => {
            const users = await usersInDb()

            const user = users[0]

            const response = await api
                .get(`/api/users/${user.id}`)
                .expect(200)
                .expect('Content-type', /application\/json/)

            const body = response.body
            expect(JSON.stringify(body.id)).toEqual(JSON.stringify(user.id))
            expect(body.username).toEqual(user.username)
            expect(body.role).toEqual(user.role)
        })

        test('returns status code 400 with malformatted id', async () => {
            const response = await api
                .get('/api/users/Invalid')
                .expect(400)
                .expect('Content-type', /application\/json/)

            expect(response.body.error).toBe('Malformatted user id')
        })

        test('returns status code 404 if no user found matching a valid id', async () => {
            const invalidId = await nonExistingId()

            await api
                .get(`/api/users/${invalidId}`)
                .expect(404)
        })
    })

    afterAll(() => {
        server.close()
    })
})