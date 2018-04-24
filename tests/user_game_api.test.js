const supertest = require('supertest')
const { app, server } = require('../index')
const UserGame = require('../models/user_game')
const User = require('../models/user')
const {
    initializeTestDb,
    userGamesInDb,
    usersInDb
} = require('../utils/test_helper')

const api = supertest(app)

describe('When there are initially some user games saved', async () => {
    beforeAll(async () => {
        await initializeTestDb()
    })

    test('all games owned by a user are returned as JSON by GET /api/users/:userId/games', async () => {
        const users = await usersInDb()

        const user = users[0]

        const response = await api
            .get(`/api/users/${user.id}/games`)
            .expect(200)
            .expect('Content-type', /application\/json/)

        const ids = response.body.map(userGame => userGame.id)

        expect(response.body.length).toBe(user.games.length)
        expect(JSON.stringify(ids)).toEqual(JSON.stringify(user.games))
    })

    afterAll(() => {
        server.close()
    })
})