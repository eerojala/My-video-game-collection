const supertest = require('supertest')
const { app, server } = require('../index')
const Game = require('../models/game')
const Platform = require('../models/platform')
const { 
    saveInitialPlatformsAndGames, 
    nonExistingId, 
    gamesInDb,
    platformsInDb,
    findPlatform,
    findGame,
    game1,
    game2,
    game3
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

        test('fails with invalid publishers', async() => {
            const invalidPublishersPost = Object.assign({}, game1)
            invalidPublishersPost.publishers = [""]

            await invalidGamePostTest(invalidPublishersPost)
        })
    })

    describe('PUT /api/games/:id', async() => {
        let successfulPutTest, invalidPutTest

        beforeAll(async () => {
            successfulPutTest = async (data) => {
                const gamesBeforePut = await gamesInDb()
                const platforms = await platformsInDb()

                data.platform = platforms[0].id
                const gameBeforePut = gamesBeforePut[0]

                await api
                    .put(`/api/games/${gameBeforePut.id}`)
                    .send(data)
                    .expect(200)
                    .expect('Content-type', /application\/json/)

                const gamesAfterPut = await gamesInDb()
                const gameAfterPut = await findGame(gameBeforePut.id)

                expect(gamesAfterPut).toHaveLength(gamesBeforePut.length)
                expect(gameAfterPut).not.toEqual(gameBeforePut)
                expect(gameAfterPut.name).toEqual(data.name)
                expect(JSON.stringify(gameAfterPut.platform)).toEqual(JSON.stringify(data.platform))
                expect(gameAfterPut.year).toEqual(data.year)
                expect(JSON.stringify(gameAfterPut.developers)).toEqual(JSON.stringify(data.developers))
                expect(JSON.stringify(gameAfterPut.publishers)).toEqual(JSON.stringify(data.publishers))
            }

            invalidPutTest = async (data) => {
                const gamesBeforePut = await gamesInDb()
                const platforms = await platformsInDb()

                data.platform = platforms[0].id 
                const response = await api
                    .put(`/api/games/${gamesBeforePut[0].id}`)
                    .send(data)
                    .expect(400)
                    .expect('Content-type', /application\/json/)

                const gamesAfterPut = await gamesInDb()

                expect(response.body.error).toBe('Invalid game parameters')
                expect(gamesAfterPut).toEqual(gamesBeforePut)
            }
        })

        test('succeeds with valid data', async() => {
            const changesToGame = Object.assign({}, game2)
            
            await successfulPutTest(changesToGame)
        })

        test('fails with invalid id', async() => {
            const gamesBeforePut = await gamesInDb()
            const invalidId = await nonExistingId()

            const response = await api
                .put(`/api/games/${invalidId}`)
                .send(game2)
                .expect(404)
                .expect('Content-type', /application\/json/)

            const gamesAfterPut = await gamesInDb()

            expect(response.body.error).toBe('No game found matching id')
            expect(gamesAfterPut).toEqual(gamesBeforePut)
        })

        test('fails with invalid platform', async() => {
            const gamesBeforePut = await gamesInDb()
            
            const invalidPlatform = Object.assign({}, game2)
            invalidPlatform.platform = "invalid"

            const response = await api
                .put(`/api/games/${gamesBeforePut[0].id}`)
                .send(invalidPlatform) 
                .expect(400)
                .expect('Content-type', /application\/json/)

            const gamesAfterPut = await gamesInDb()

            expect(gamesAfterPut).toEqual(gamesBeforePut)
            expect(response.body.error).toBe('Invalid game parameters')
        })

        test('fails with invalid name', async() => {
            const invalidName = Object.assign({}, game2)
            invalidName.name = ""

            await invalidPutTest(invalidName)
        })
        
        test('fails with invalid year', async() => {
            const invalidYear = Object.assign({}, game2)
            invalidYear.year = 225.52

            await invalidPutTest(invalidYear)
        })

        test('fails with invalid developers', async () => {
            const invalidDevelopers = Object.assign({}, game2)
            invalidDevelopers.developers = ["", ""]

            await invalidPutTest(invalidDevelopers)
        })

        test('fails with empty developer array', async () => {
            const emptyDevelopers = Object.assign({}, game2)
            emptyDevelopers.developers = []

            await invalidPutTest(emptyDevelopers)
        })

        test('fails with invalid publishers', async () => {
            const invalidPublishers = Object.assign({}, game2)
            invalidPublishers.publishers = [""]

            await invalidPutTest(invalidPublishers)
        })
    })

    describe('DELETE /api/games/:id', async () => {
        test('successfully deletes the game matching the id', async () => {
            const platforms = await platformsInDb()
            
            const game = Object.assign({}, game3)
            const platform = platforms[1]
            game.platform = platform.id       
            const newGame = new Game(game)
            platform.games.push(newGame.id)
            await newGame.save()
            await Platform.findByIdAndUpdate(platform.id, platform, { new: true, runValidators: true })

            const gamesBeforeDelete = await gamesInDb()
            const platformBeforeDelete = await findPlatform(platform.id)
            const gameIdsBeforeDelete = gamesBeforeDelete.map(game => game.id)

            expect(gameIdsBeforeDelete).toContain(newGame.id)
            expect(JSON.stringify(platformBeforeDelete.games)).toContain(JSON.stringify(newGame.id))

            await api
                .delete(`/api/games/${newGame.id}`)
                .expect(204)
            
            const gamesAfterDelete = await gamesInDb()
            const platformAfterDelete = await findPlatform(platform.id)

            expect(gamesAfterDelete).toHaveLength(gamesBeforeDelete.length - 1)
            expect(gamesAfterDelete).not.toContain(newGame)
            expect(platformAfterDelete.games).not.toContain(newGame.id)
        })
    })

    afterAll(() => {
        server.close()
    })
}) 