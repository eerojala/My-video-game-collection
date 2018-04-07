const supertest = require('supertest')
const { app, server } = require('../index')
const Game = require('../models/game')
const { 
    saveInitialPlatformsAndGames, 
    nonExistingId, 
    gamesInDb,
    platformsInDb,
    findPlatform,
    game1
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
            expect(body.name).toBe(game.name)
        })

        test('returns status code 400 with malformatted id', async () => {
            const response = await api
                .get('/api/games/invalid')
                .expect(400)
                .expect('Content-type', /application\/json/)

            expect(response.body.error).toBe('Malformatted game id')
        })

        test('returns status code 404 if no game found matching a valid id', async () => {
            const unusedId = await nonExistingId()

            await api
                .get(`/api/games/${unusedId}`)
                .expect(404)
        })
    })

    describe('POST /api/games', async () => {
        let invalidGamePostTest

        beforeAll(async () => {
            invalidGamePostTest = async (data) => {
                const gamesBeforePost = await gamesInDb()

                const response = await api
                    .post('/api/games')
                    .send(data)
                    .expect(400)
                    .expect('Content-type', /application\/json/)

                const gamesAfterPost = await gamesInDb()

                expect(response.body.error).toBe('Invalid parameters')
                expect(gamesBeforePost).toEqual(gamesAfterPost)
            }
        })

        test('succeeds with valid data', async () => {
            const platforms = await platformsInDb()

            const newGame = Object.assign({}, game1)
            newGame.platform = platforms[1].id

            const gamesBeforePost = await gamesInDb()

            const response = await api
                .post('/api/games')
                .send(newGame)
                .expect(200)
                .expect('Content-type', /application\/json/)

            const gamesAfterPost = await gamesInDb()

            expect(gamesAfterPost).toHaveLength(gamesBeforePost.length + 1)

            const ids = gamesAfterPost.map(game => game.id)
            const names = gamesAfterPost.map(game => game.name)
            expect(ids).toContain(response.body.id)
            expect(names).toContain(newGame.name)

            const platformAfterPost = await findPlatform(newGame.platform)

            expect(platformAfterPost.games).toContain(response.body.id)
        })
    })

    afterAll(() => {
        server.close()
    })
}) 