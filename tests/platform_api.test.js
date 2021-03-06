const supertest = require('supertest')
const { app, server } = require('../index')
const Platform = require('../models/platform')
const Game = require('../models/game')
const { 
    saveInitialPlatformsAndGames,
    saveInitialUsers, 
    nonExistingId, 
    platformsInDb,
    gamesInDb,
    findPlatform,
    findGame,
    platform1,
    platform2,
    platform3,
    game3,
    memberCredentials,
    adminCredentials
} = require('../utils/test_helper')

const api = supertest(app)

describe('When there are initially some platforms saved', async () => {
    beforeAll(async () => {
        await saveInitialPlatformsAndGames()
        await saveInitialUsers()
    })

    test('all platforms are returned as JSON by GET /api/platforms', async () => {
        const platforms = await platformsInDb()

        const response = await api
            .get('/api/platforms')
            .expect(200)
            .expect('Content-type', /application\/json/)

        const body = response.body
        const ids = body.map(platform => platform.id)
        const names = body.map(platform => platform.name)
        const creators = body.map(platform => platform.creator)
        const years = body.map(platform => platform.year)
        const games = body.map(platform => JSON.stringify(platform.games.map(game => game._id)))

        expect(body).toHaveLength(platforms.length)
        platforms.forEach(platform => {
            expect(ids).toContain(platform.id)
            expect(names).toContain(platform.name)
            expect(creators).toContain(platform.creator)
            expect(years).toContain(platform.year)
            expect(games).toContain(JSON.stringify(platform.games))
        })
    })

    describe('GET /api/platforms/:id', async () =>  {
        test('returns an individual platform as JSON', async () => {
            const platforms = await platformsInDb()
    
            const platform = platforms[1]
    
            const response = await api
                .get(`/api/platforms/${platform.id}`)
                .expect(200)
                .expect('Content-type', /application\/json/)
    
            const body = response.body
        
            expect(body.id).toEqual(platform.id)
            expect(body.name).toEqual(platform.name)
            expect(body.creator).toEqual(platform.creator)
            expect(body.year).toEqual(platform.year)
            expect(JSON.stringify(body.games.map(game => game._id))).toEqual(JSON.stringify(platform.games))
        })
    
        test('returns status code 400 with malformatted id', async () => {
            const response = await api
                .get('/api/platforms/invalid')
                .expect(400)
                .expect('Content-type', /application\/json/)

            expect(response.body.error).toBe('Malformatted platform id')
        })

        test('returns status code 404 if no platform found matching a valid id', async () => {
            const invalidId = await nonExistingId()
            
            await api
                .get(`/api/platforms/${invalidId}`)
                .expect(404)
        })
    })

    describe('and the user is not logged in', async () => {
        test('POST /api/platforms fails', async () => {
            const platformsBeforePost = await platformsInDb()

            const response = await api
                .post('/api/platforms')
                .send(platform1)
                .expect(401)
                .expect('Content-type', /application\/json/)

            const platformsAfterPost = await platformsInDb()

            expect(response.body.error).toBe('Must be logged in as admin to post a new platform')
            expect(platformsAfterPost).toEqual(platformsBeforePost)
        })
        
        test('PUT /api/platforms/:id fails', async () => {
            const platformsBeforePut = await platformsInDb()

            const response = await api
                .put(`/api/platforms/${platformsBeforePut[0].id}`)
                .send(platform2)
                .expect(401)
                .expect('Content-type', /application\/json/)

            const platformsAfterPut = await platformsInDb()

            expect(response.body.error).toBe('Must be logged in as admin to update a platform')
            expect(platformsAfterPut).toEqual(platformsBeforePut)
        })

        test('DELETE /api/platforms/:id fails', async () => {
            const platformsBeforeDelete = await platformsInDb()
            
            const response = await api
                .delete(`/api/platforms/${platformsBeforeDelete[0].id}`)
                .expect(401)
                .expect('Content-type', /application\/json/)

            const platformsAfterDelete = await platformsInDb()

            expect(response.body.error).toBe('Must be logged in as admin to delete a platform')
            expect(platformsAfterDelete).toEqual(platformsBeforeDelete)
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

        test('POST /api/platforms fails', async () => {
            const platformsBeforePost = await platformsInDb()

            const response = await api
                .post('/api/platforms')
                .set('Authorization', 'bearer ' + memberToken)
                .send(platform1)
                .expect(401)
                .expect('Content-type', /application\/json/)

            const platformsAfterPost = await platformsInDb()

            expect(response.body.error).toBe('Must be logged in as admin to post a new platform')
            expect(platformsAfterPost).toEqual(platformsBeforePost)
        })
        
        test('PUT /api/platforms/:id fails', async () => {
            const platformsBeforePut = await platformsInDb()

            const response = await api
                .put(`/api/platforms/${platformsBeforePut[0].id}`)
                .set('Authorization', 'bearer ' + memberToken)
                .send(platform2)
                .expect(401)
                .expect('Content-type', /application\/json/)

            const platformsAfterPut = await platformsInDb()

            expect(response.body.error).toBe('Must be logged in as admin to update a platform')
            expect(platformsAfterPut).toEqual(platformsBeforePut)
        })

        test('DELETE /api/platforms/:id fails', async() => {
            const platformsBeforeDelete = await platformsInDb()
            
            const response = await api
                .delete(`/api/platforms/${platformsBeforeDelete[0].id}`)
                .set('Authorization', 'bearer ' + memberToken)
                .expect(401)
                .expect('Content-type', /application\/json/)

            const platformsAfterDelete = await platformsInDb()

            expect(response.body.error).toBe('Must be logged in as admin to delete a platform')
            expect(platformsAfterDelete).toEqual(platformsBeforeDelete)
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

        describe('POST /api/platforms', async() => {
            let invalidPlatformPostTest
    
            beforeAll(async () => {
                invalidPlatformPostTest = async (data) => {
                    const platformsBeforePost = await platformsInDb()
    
                    const response = await api
                        .post('/api/platforms')
                        .set('Authorization', 'bearer ' + adminToken)
                        .send(data)
                        .expect(400)
                        .expect('Content-type', /application\/json/)
            
                    const platformsAfterPost = await platformsInDb()
    
                    expect(response.body.error).toBe('Invalid platform parameters')
                    expect(platformsBeforePost).toEqual(platformsAfterPost)
                }
            })
    
            test('succeeds with valid data', async () => {
                const platformsBeforePost = await platformsInDb()
    
                const response = await api   
                    .post('/api/platforms')
                    .set('Authorization', 'bearer ' + adminToken)
                    .send(platform1)
                    .expect(200)
                    .expect('Content-type', /application\/json/)
    
                const platformsAfterPost = await platformsInDb()
                const platformAfterPost = await findPlatform(response.body.id)
    
                expect(platformsAfterPost).toHaveLength(platformsBeforePost.length + 1)
                expect(platformAfterPost.name).toBe(platform1.name)
                expect(platformAfterPost.creator).toBe(platform1.creator)
                expect(platformAfterPost.year).toBe(platform1.year)
                expect(JSON.stringify(platformAfterPost.games)).toBe(JSON.stringify(platform1.games))
            })
    
            test('fails with an empty name', async () => {
                const emptyNamePost = Object.assign({}, platform1)
                emptyNamePost.name = ""
        
                await invalidPlatformPostTest(emptyNamePost)
            })
        
            test('fails with an empty creator', async () => {
                const emptyCreatorPost = Object.assign({}, platform1)
                emptyCreatorPost.creator = ""
        
                await invalidPlatformPostTest(emptyCreatorPost)
            })
        
            test ('fails with an invalid year', async () => {
                const invalidYearPost = Object.assign({}, platform1)
                invalidYearPost.year = 1778.5
                
                await invalidPlatformPostTest(invalidYearPost)
            })
        })
    
        describe('PUT /api/platforms/:id', async () => {
            let updatesToPlatform, invalidParameterPutTest
            
            beforeAll(async () => {
                updatesToPlatform = platform2
    
                invalidParameterPutTest = async (data) => {
                    const platformsBeforePut = await platformsInDb()
        
                    const response = await api
                        .put(`/api/platforms/${platformsBeforePut[0].id}`)
                        .set('Authorization', 'bearer ' + adminToken)
                        .send(data)
                        .expect(400)
                        .expect('Content-type', /application\/json/)
        
                    const platformsAfterPut = await platformsInDb()
        
                    expect(response.body.error).toBe('Invalid platform parameters')
                    expect(platformsAfterPut).toEqual(platformsBeforePut)
                }
            })
    
            test ('succeeds with valid data', async () => {
                const platformsBeforePut = await platformsInDb()
                
                const platformBeforePut = platformsBeforePut[0]
                
                await api
                    .put(`/api/platforms/${platformBeforePut.id}`)
                    .set('Authorization', 'bearer ' + adminToken)
                    .send(updatesToPlatform)
                    .expect(200)
                    .expect('Content-type', /application\/json/)
                
                const platformsAfterPut = await platformsInDb()
                const platformAfterPut = await findPlatform(platformBeforePut.id)
    
                expect(platformsAfterPut).toHaveLength(platformsBeforePut.length)
                expect(platformAfterPut.name).toBe(updatesToPlatform.name)
                expect(platformAfterPut.creator).toBe(updatesToPlatform.creator)
                expect(platformAfterPut.year).toBe(updatesToPlatform.year)
                expect(JSON.stringify(platformAfterPut.games)).toBe(JSON.stringify(platformBeforePut.games)) 
                // PUT /api/platforms/:id does not update the games list
            })
    
            test ('fails with valid data but invalid id', async () => {
                const platformsBeforePut = await platformsInDb()
                const invalidId = await nonExistingId()
                
                const response = await api
                    .put(`/api/platforms/${invalidId}`)
                    .set('Authorization', 'bearer ' + adminToken)
                    .send(updatesToPlatform)
                    .expect(404)
                    .expect('Content-type', /application\/json/)
    
                const platformsAfterPut = await platformsInDb()
        
                expect(response.body.error).toBe('No platform found matching id')
                expect(platformsAfterPut).toEqual(platformsBeforePut)
            })
    
            test('fails with an empty name', async () => {
                const emptyNamePut = Object.assign({}, updatesToPlatform)
                emptyNamePut.name = ''
    
                await invalidParameterPutTest(emptyNamePut)
            })
    
            test('fails with an empty creator', async () => {      
                const emptyCreatorPut = Object.assign({}, updatesToPlatform)
                emptyCreatorPut.creator = ''
    
                await invalidParameterPutTest(emptyCreatorPut)
            })
    
            test('fails with an invalid year', async () => {
                const invalidYearPut = Object.assign({}, updatesToPlatform)
                invalidYearPut.year = 444.111
    
                await invalidParameterPutTest(invalidYearPut)
            })
        })
    
        describe('DELETE /api/platforms/:id', async () => {
            test('successfully deletes the platform matching the id and the games associated with it', async () => {
                const newPlatform = new Platform(platform3)
    
                await newPlatform.save()
    
                const platformsBeforeDelete = await platformsInDb()
    
                const platformIdsBeforeDelete = platformsBeforeDelete.map(platform => platform.id)
    
                expect(JSON.stringify(platformIdsBeforeDelete)).toContain(JSON.stringify(newPlatform.id))
    
                await api
                    .delete(`/api/platforms/${newPlatform.id}`)
                    .set('Authorization', 'bearer ' + adminToken)
                    .expect(204)
    
                const platformsAfterDelete = await platformsInDb()
    
                expect(JSON.stringify(platformsAfterDelete)).not.toEqual(JSON.stringify(platformsBeforeDelete))
                expect(platformsAfterDelete).toHaveLength(platformsBeforeDelete.length - 1)
                expect(JSON.stringify(platformsAfterDelete)).not.toContain(JSON.stringify(newPlatform))
            })
    
            test('successfuly deletes the games that belong to the deleted platform', async () => {
                const newPlatform = new Platform(platform3)
    
                await newPlatform.save()
    
                const game = Object.assign({}, game3)
                game.platform = newPlatform.id
                const newGame = new Game(game)
    
                await newGame.save()
    
                const savedGame = await findGame(newGame.id)
    
                expect(JSON.stringify(savedGame.platform)).toBe(JSON.stringify(newPlatform.id))
    
                newPlatform.games = [newGame.id]
    
                await newPlatform.save()
    
                const savedPlatform = await findPlatform(newPlatform.id)
    
                expect(JSON.stringify(savedPlatform.games)).toContain(JSON.stringify(newGame.id))
    
                const gamesBeforeDelete = await gamesInDb()
    
                await api
                    .delete(`/api/platforms/${newPlatform.id}`)
                    .set('Authorization', 'bearer ' + adminToken)
                    .expect(204)
    
                const gamesAfterDelete = await gamesInDb()
    
                expect(JSON.stringify(gamesBeforeDelete)).toContain(JSON.stringify(newGame.id))
                expect(gamesAfterDelete).toHaveLength(gamesBeforeDelete.length - 1)
                expect(JSON.stringify(gamesAfterDelete)).not.toContain(JSON.stringify(newGame.id))
            })
    
            test('returns 404 if trying to delete a platform matching an invalid id', async () => {
                const platformsBeforeDelete = await platformsInDb()
    
                const invalidId = await nonExistingId()
    
                const response = await api
                    .delete(`/api/platforms/${invalidId}`)
                    .set('Authorization', 'bearer ' + adminToken)
                    .expect(404)
                    .expect('Content-type', /application\/json/)
    
                const platformsAfterDelete = await platformsInDb()
    
                expect(response.body.error).toBe('No platform found matching id')
                expect(platformsBeforeDelete).toEqual(platformsAfterDelete)
            })
    
            test('returns status code 400 if trying to delete a platform matching a malformatted id', async () => {
                const platformsBeforeDelete = await platformsInDb()
    
                const response = await api
                    .delete('/api/platforms/invalid')
                    .set('Authorization', 'bearer ' + adminToken)
                    .expect(400)
                    .expect('Content-type', /application\/json/)
    
                expect(response.body.error).toBe('Malformatted platform id')
    
                const platformsAfterDelete = await platformsInDb()
    
                expect(platformsBeforeDelete).toEqual(platformsAfterDelete)
            })
        })
    })

    afterAll(() => {
        server.close()
    })
})