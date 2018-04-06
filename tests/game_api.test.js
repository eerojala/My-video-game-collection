const supertest = require('supertest')
const { app, server } = require('../index')
const Game = require('../models/game')
const { 
    saveInitialPlatformsAndGames, 
    nonExistingId, 
    gamesInDb
} = require('../utils/test_helper')

const api = supertest(app)

describe('When there are initially some games and platforms saved', async () => {
    beforeAll(async () => {
        await saveInitialPlatformsAndGames()
    })

    test('all games are returned as JSON from GET /api/games', async () => {
        const games = await gamesInDb()

        const response = await api
            .get('/api/games')
            .expect(200)
            .expect('Content-type', /application\/json/)

        const names = response.body.map(game => game.name)

        expect(games).toHaveLength(3)

        games.forEach(game => {
            expect(names).toContain(game.name)
        })
    })

    afterAll(() => {
        server.close()
    })
}) 