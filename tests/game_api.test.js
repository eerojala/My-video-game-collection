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
        let successfulGamePostTest, invalidGamePostTest

        beforeAll(async () => {
            successfulGamePostTest = async (data) => {
                const gamesBeforePost = await gamesInDb()
                const platforms = await platformsInDb()

                data.platform = platforms[1].id

                const response = await api
                    .post('/api/games')
                    .send(data)
                    .expect(200)
                    .expect('Content-type', /application\/json/)

                const gamesAfterPost = await gamesInDb()

                expect(gamesAfterPost).toHaveLength(gamesBeforePost.length + 1)

                const ids = gamesAfterPost.map(game => game.id)
                const names = gamesAfterPost.map(game => game.name)
                expect(ids).toContain(response.body.id)
                expect(names).toContain(data.name)

                const platformAfterPost = await findPlatform(data.platform)

                expect(platformAfterPost.games).toContain(response.body.id)
            }

            invalidGamePostTest = async (data) => {
                const gamesBeforePost = await gamesInDb()
                const platforms = await platformsInDb()

                const platformBeforePost = platforms[1]
                data.platform = platformBeforePost.id

                const response = await api
                    .post('/api/games')
                    .send(data)
                    .expect(400)
                    .expect('Content-type', /application\/json/)

                const gamesAfterPost = await gamesInDb()
                const platformAfterPost = await findPlatform(data.platform)

                expect(response.body.error).toBe('Invalid game parameters')
                expect(gamesBeforePost).toEqual(gamesAfterPost)
                expect(platformBeforePost).toEqual(platformAfterPost)
            }    
        })

        test('succeeds with valid data', async () => {
            const newGame = Object.assign({}, game1)

            await successfulGamePostTest(newGame)
        })

        test('succeeds with empty publisher array', async () => {
            const emptyPublishersPost = Object.assign({}, game1)
            emptyPublishersPost.publishers = []

            await successfulGamePostTest(emptyPublishersPost)
        })

        test('succeeds with no publisher array', async () => {
            const noPublishersPost = Object.assign({}, game1)
            noPublishersPost.publishers = null

            await successfulGamePostTest(noPublishersPost)
        })

        test('fails with no valid platform', async () => {
            const gamesBeforePost = await gamesInDb()

            const response = await api
                .post('/api/games')
                .send(game1)
                .expect(400)
                .expect('Content-type', /application\/json/)

            const gamesAfterPost = await gamesInDb()

            expect(response.body.error).toBe('No platform found')
            expect(gamesBeforePost).toEqual(gamesAfterPost)
        })

        test('fails with empty name', async () => {
            const emptyNamePost = Object.assign({}, game1)
            emptyNamePost.name = ""

            await invalidGamePostTest(emptyNamePost)
        })

        test('fails with an invalid year', async () => {
            const invalidYearPost = Object.assign({}, game1)
            invalidYearPost.year = 1988.888

            await invalidGamePostTest(invalidYearPost)
        })

        test('fails with invalid developers', async () => {
            const invalidDevelopersPost = Object.assign({}, game1)
            invalidDevelopersPost.developers = ["", "", ""]

            await invalidGamePostTest(invalidDevelopersPost)
        })

        test('fails with empty developer array', async () => {
            const emptyDevelopersPost = Object.assign({}, game1)
            emptyDevelopersPost.developers = []

            await invalidGamePostTest(emptyDevelopersPost)
        })

        test('fails with no developer array', async() => {
            const noDevelopersPost = Object.assign({}, game1)
            noDevelopersPost.developers = null

            await invalidGamePostTest(noDevelopersPost)
        })

        test('fails with invalid publishers', async() => {
            const invalidPublishersPost = Object.assign({}, game1)
            invalidPublishersPost.publishers = [""]

            await invalidGamePostTest(invalidPublishersPost)
        })
    })

    afterAll(() => {
        server.close()
    })
}) 