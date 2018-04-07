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
        const platforms = response.body.map(game => String(game.platform._id))
        const years = response.body.map(game => game.year)
        const developers = response.body.map(game => game.developer)
        const publishers = response.body.map(game => game.publisher)

        expect(games).toHaveLength(3)

        games.forEach(game => {
            expect(names).toContain(game.name)
            expect(platforms).toContain(String(game.platform))
            expect(years).toContain(game.year)
            expect(developers).toContain(game.developer)
            expect(publishers).toContain(game.publisher)
        })
    })

    describe('GET /api/games/:id',  async () => {
        test('returns an individual game as JSON', async () => {
            const games = await gamesInDb()

            const game = games[0]

            const response = await api
                .get(`/api/games/${game.id}`)
                .expect(200)
                .expect('Content-type', /application\/json/)

            const body = response.body

            expect(body._id).toEqual(game._id)
            expect(body.name).toEqual(game.name)
            expect(String(body.platform._id)).toEqual(String(game.platform))
            expect(body.year).toEqual(game.year)
            expect(body.developer).toEqual(game.developer)
            expect(body.publisher).toEqual(game.publisher)
        })

        test('returns status code 400 with malformatted id', async () => {
            const response = await api
                .get('/api/platforms/invalid')
                .expect(400)
                .expect('Content-type', /application\/json/)

            expect(response.body.error).toBe('Malformatted id')
        })

        test('returns status code 404 if no game found matching a valid id', async () => {
            const unusedId = await nonExistingId()

            await api
                .get(`/api/games/${unusedId}`)
                .expect(404)
        })
    })

    afterAll(() => {
        server.close()
    })
}) 