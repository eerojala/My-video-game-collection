const supertest = require('supertest')
const { app, server } = require('../index')
const Game = require('../models/game')
const Platform = require('../models/platform')
const { 
    initializeTestDb,
    nonExistingId, 
    gamesInDb,
    platformsInDb,
    userGamesInDb,
    findPlatform,
    findGame,
    game1,
    game2,
    game3,
    memberCredentials,
    adminCredentials
} = require('../utils/test_helper')

const api = supertest(app)

describe('When there are initially some games and platforms saved', async () => {
    beforeAll(async () => {
        await initializeTestDb()
    })

    test('all games are returned as JSON from GET /api/games', async () => {
        const games = await gamesInDb()

        const response = await api
            .get('/api/games')
            .expect(200)
            .expect('Content-type', /application\/json/)

        const names = response.body.map(game => game.name)
        const platforms = response.body.map(game => JSON.stringify(game.platform._id))
        const years = response.body.map(game => game.year)
        const developers = response.body.map(game => JSON.stringify(game.developers))
        const publishers = response.body.map(game => JSON.stringify(game.publishers))

        expect(response.body).toHaveLength(games.length)
        games.forEach(game => {
            expect(names).toContain(game.name)
            expect(platforms).toContain(JSON.stringify(game.platform))
            expect(years).toContain(game.year)
            expect(developers).toContain(JSON.stringify(game.developers))
            expect(publishers).toContain(JSON.stringify(game.publishers))
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

            expect(body.id).toEqual(game.id)
            expect(body.name).toBe(game.name)
            expect(JSON.stringify(body.developer)).toBe(JSON.stringify(game.developer))
            expect(body.year).toBe(game.year)
            expect(JSON.stringify(body.developers)).toBe(JSON.stringify(game.developers))
            expect(JSON.stringify(body.publishers)).toBe(JSON.stringify(game.publishers))
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

    describe('and the user is not logged in', async () => {
        test('POST /api/games fails', async () => {
            const gamesBeforePost = await gamesInDb()

            const response = await api
                .post('/api/games')
                .send(game1)
                .expect(401)
                .expect('Content-type', /application\/json/)

            const gamesAfterPost = await gamesInDb()

            expect(response.body.error).toBe('Must be logged in as admin to post a new game')
            expect(gamesAfterPost).toEqual(gamesBeforePost)
        })

        test('PUT /api/games/:id fails', async () => {
            const gamesBeforePut = await gamesInDb()

            const response = await api
                .put(`/api/games/${gamesBeforePut[0].id}`)
                .send(game2)
                .expect(401)
                .expect('Content-type', /application\/json/)

            const gamesAfterPut = await gamesInDb()

            expect(response.body.error).toBe('Must be logged in as admin to update a game')
            expect(gamesAfterPut).toEqual(gamesBeforePut)
        })

        test('DELETE /api/games/:id fails', async () => {
            const gamesBeforeDelete = await gamesInDb()

            const response = await api
                .delete(`/api/games/${gamesBeforeDelete[0].id}`)
                .expect(401)
                .expect('Content-type', /application\/json/)

            const gamesAfterDelete = await gamesInDb()

            expect(response.body.error).toBe('Must be logged in as admin to delete a game')
            expect(gamesAfterDelete).toEqual(gamesBeforeDelete)
        })
    })

    describe('and the user is logged in on a regular account', async () => {
        let memberToken

        beforeAll(async () => {
            const response = await api
                .post('/api/login')
                .send(memberCredentials)

            memberToken = response.body.token
        })

        test('POST /api/games fails', async () => {
            const gamesBeforePost = await gamesInDb()

            const response = await api
                .post('/api/games')
                .set('Authorization', 'bearer ' + memberToken)
                .send(game1)
                .expect(401)
                .expect('Content-type', /application\/json/)

            const gamesAfterPost = await gamesInDb()

            expect(response.body.error).toBe('Must be logged in as admin to post a new game')
            expect(gamesAfterPost).toEqual(gamesBeforePost)
        })

        test('PUT /api/games/:id fails', async () => {
            const gamesBeforePut = await gamesInDb()

            const response = await api
                .put(`/api/games/${gamesBeforePut[0].id}`)
                .set('Authorization', 'bearer ' + memberToken)
                .send(game2)
                .expect(401)
                .expect('Content-type', /application\/json/)

            const gamesAfterPut = await gamesInDb()

            expect(response.body.error).toBe('Must be logged in as admin to update a game')
            expect(gamesAfterPut).toEqual(gamesBeforePut)
        })

        test('DELETE /api/games/:id fails', async () => {
            const gamesBeforeDelete = await gamesInDb()

            const response = await api
                .delete(`/api/games/${gamesBeforeDelete[0].id}`)
                .set('Authorization', 'bearer ' + memberToken)
                .expect(401)
                .expect('Content-type', /application\/json/)

            const gamesAfterDelete = await gamesInDb()

            expect(response.body.error).toBe('Must be logged in as admin to delete a game')
            expect(gamesAfterDelete).toEqual(gamesBeforeDelete)
        })
    })

    describe('and the user is logged in on an admin account', async () => {
        let adminToken

        beforeAll(async () => {
            const response = await api
                .post('/api/login')
                .send(adminCredentials)

            adminToken = response.body.token
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
                        .set('Authorization', 'bearer ' + adminToken)
                        .send(data)
                        .expect(200)
                        .expect('Content-type', /application\/json/)
    
                    const gamesAfterPost = await gamesInDb()
                    const game = await findGame(response.body.id)
                    const platformAfterPost = await findPlatform(data.platform)
    
                    expect(gamesAfterPost).toHaveLength(gamesBeforePost.length + 1)
                    expect(game.name).toBe(data.name)
                    expect(JSON.stringify(game.platform)).toBe(JSON.stringify(data.platform))
                    expect(game.year).toBe(data.year)
                    expect(JSON.stringify(game.developers)).toBe(JSON.stringify(data.developers))
                    expect(JSON.stringify(game.publishers)).toBe(JSON.stringify(data.publishers))
                    expect(platformAfterPost.games).toContain(response.body.id)
                }
    
                invalidGamePostTest = async (data) => {
                    const gamesBeforePost = await gamesInDb()
                    const platforms = await platformsInDb()
    
                    const platformBeforePost = platforms[1]
                    data.platform = platformBeforePost.id
    
                    const response = await api
                        .post('/api/games')
                        .set('Authorization', 'bearer ' + adminToken)
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
                    .set('Authorization', 'bearer ' + adminToken)
                    .send(game1)
                    .expect(400)
                    .expect('Content-type', /application\/json/)
    
                const gamesAfterPost = await gamesInDb()
    
                expect(response.body.error).toBe('No platform found matching given platform id')
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
                        .set('Authorization', 'bearer ' + adminToken)
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
                        .set('Authorization', 'bearer ' + adminToken)
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
                    .set('Authorization', 'bearer ' + adminToken)
                    .send(game2)
                    .expect(404)
                    .expect('Content-type', /application\/json/)
    
                const gamesAfterPut = await gamesInDb()
    
                expect(response.body.error).toBe('No game found matching game id')
                expect(gamesAfterPut).toEqual(gamesBeforePut)
            })
    
            test('fails with invalid platform', async () => {
                const gamesBeforePut = await gamesInDb()
                
                const invalidPlatform = Object.assign({}, game2)
                invalidPlatform.platform = "invalid"
    
                const response = await api
                    .put(`/api/games/${gamesBeforePut[0].id}`)
                    .set('Authorization', 'bearer ' + adminToken)
                    .send(invalidPlatform) 
                    .expect(400)
                    .expect('Content-type', /application\/json/)
    
                const gamesAfterPut = await gamesInDb()
    
                expect(gamesAfterPut).toEqual(gamesBeforePut)
                expect(response.body.error).toBe('Invalid game parameters')
            })

            test('fails with a non-existent platform', async () => {
                const gamesBeforePut = await gamesInDb()
                const nonExistentId = await nonExistingId()

                const nonExistentPlatform = Object.assign({}, game2)
                nonExistentPlatform.platform = nonExistentId

                const response = await api
                    .put(`/api/games/${gamesBeforePut[0].id}`)
                    .set('Authorization', 'bearer ' + adminToken)
                    .send(nonExistentPlatform) 
                    .expect(400)
                    .expect('Content-type', /application\/json/)
    
                const gamesAfterPut = await gamesInDb()
    
                expect(gamesAfterPut).toEqual(gamesBeforePut)
                expect(response.body.error).toBe('No platform found matching platform id')
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
                const gamesBeforeDelete = await gamesInDb()
                const game = gamesBeforeDelete[1]
                const platformBeforeDelete = await findPlatform(game.platform)
                const userGamesBeforeDelete = await userGamesInDb()
                
                let userGamesWhichHaveTheGame = userGamesBeforeDelete.filter(userGame => JSON.stringify(userGame.game) === JSON.stringify(game.id))
                
                expect(JSON.stringify(platformBeforeDelete.games)).toContain(JSON.stringify(game.id))
                expect(userGamesWhichHaveTheGame.length).toBeGreaterThan(0)

                await api
                    .delete(`/api/games/${game.id}`)
                    .set('Authorization', 'bearer ' + adminToken)
                    .expect(204)

                const gamesAfterDelete = await gamesInDb()
                const platformAfterDelete = await findPlatform(game.platform)
                const userGamesAfterDelete = await userGamesInDb()

                userGamesWhichHaveTheGame = userGamesAfterDelete.filter(userGame => JSON.stringify(userGame.game) === JSON.stringify(game.id))

                expect(gamesAfterDelete).toHaveLength(gamesBeforeDelete.length - 1)
                expect(JSON.stringify(gamesAfterDelete)).not.toContain(JSON.stringify(game))
                expect(JSON.stringify(platformAfterDelete.games)).not.toContain(JSON.stringify(game.id))
                expect(userGamesAfterDelete.length).toBeGreaterThan(0)
                expect(userGamesWhichHaveTheGame).toHaveLength(0)
            })
    
            test('returns 404 if trying to delete a game matching a non-existing id', async () => {
                const gamesBeforeDelete = await gamesInDb()
                const invalidId = await nonExistingId()
    
                const response = await api
                    .delete(`/api/games/${invalidId}`)
                    .set('Authorization', 'bearer ' + adminToken)
                    .expect(404)
                    .expect('Content-type', /application\/json/)
    
                const gamesAfterDelete = await gamesInDb()
    
                expect(response.body.error).toBe('No game found matching id')
                expect(gamesAfterDelete).toEqual(gamesBeforeDelete)
            })
    
            test ('returns status code 400 if trying to delete a game matching a malformatted id', async () => {
                const gamesBeforeDelete = await gamesInDb()
    
                const response = await api
                    .delete('/api/games/invalid')
                    .set('Authorization', 'bearer ' + adminToken)
                    .expect(400)
                    .expect('Content-type', /application\/json/)
    
                const gamesAfterDelete = await gamesInDb()
    
                expect(response.body.error).toBe('Malformatted game id')
                expect(gamesAfterDelete).toEqual(gamesBeforeDelete)
            })
        })
    })

    afterAll(() => {
        server.close()
    })
}) 