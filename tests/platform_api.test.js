const supertest = require('supertest')
const { app, server } = require('../index')
const Platform = require('../models/platform')
const { saveInitialPlatformsAndGames, nonExistingId, platformsInDb, newPlatform } = require('../utils/test_helper')

const api = supertest(app)

describe('When there are initially some platforms saved', async () => {
    beforeAll(async () => {
        await saveInitialPlatformsAndGames()
    })

    test('all platforms are returned as JSON by GET /api/platforms', async () => {
        const platforms = await platformsInDb()

        const response = await api
            .get('/api/platforms')
            .expect(200)
            .expect('Content-type', /application\/json/)

        const returnedNames = response.body.map(platform => platform.name)
        platforms.forEach(platform => {
            expect(returnedNames).toContain(platform.name)
        })
    })

    describe('GET /api/platforms/:id', async () =>  {
        test('individual platform is returned as JSON by GET /api/platforms/:id', async () => {
            const platforms = await platformsInDb()
    
            const platform = platforms[1]
    
            const response = await api
                .get(`/api/platforms/${platform.id}`)
                .expect(200)
                .expect('Content-type', /application\/json/)
    
            const body = response.body
        
            expect(body._id).toEqual(platform._id)
            expect(body.name).toEqual(platform.name)
            expect(body.creator).toEqual(platform.creator)
            expect(body.year).toEqual(platform.year)
            expect(body.games).toHaveLength(2)
        })
    
        test('returns status code 400 with malformatted id', async () => {
            const response = await api
                .get('/api/platforms/invalid')
                .expect(400)
                .expect('Content-type', /application\/json/)
        })

        test('returns status code 404 if no platform found matching valid id', async () => {
            const invalidId = await nonExistingId()
            
            const response = await api
                .get(`/api/platforms/${invalidId}`)
                .expect(404)
        })
    })

    describe('POST /api/platforms', async() => {
        let invalidParamteterPostTest

        beforeAll(async () => {
            invalidParameterPostTest = async (data) => {
                const platformsBeforePost = await platformsInDb()

                const response = await api
                    .post('/api/platforms')
                    .send(data)
                    .expect(400)
                    .expect('Content-type', /application\/json/)
        
                const platformsAfterPost = await platformsInDb()

                expect(response.body.error).toBe('Invalid parameters')
                expect(platformsBeforePost).toEqual(platformsAfterPost)
            }
        })

        test('succeeds with valid data', async () => {
            const platformsBeforePost = await platformsInDb()

            await api   
                .post('/api/platforms')
                .send(newPlatform)
                .expect(200)
                .expect('Content-type', /application\/json/)

            const platformsAfterPost = await platformsInDb()

            expect(platformsAfterPost).toHaveLength(platformsBeforePost.length + 1)
            
            const names = platformsAfterPost.map(platform => platform.name)
            const creators = platformsAfterPost.map(platform => platform.creator)
            const years = platformsAfterPost.map(platform => platform.year)

            expect(names).toContain(newPlatform.name)
            expect(creators).toContain(newPlatform.creator)
            expect(years).toContain(newPlatform.year)
        })

        test('fails with an empty name', async () => {
            const emptyNamePost = Object.assign({}, newPlatform)
            emptyNamePost.name = ""
    
            await invalidParameterPostTest(emptyNamePost)
        })
    
        test('fails with an empty creator', async () => {
            const emptyCreatorPost = Object.assign({}, newPlatform)
            emptyCreatorPost.creator = ""
    
            await invalidParameterPostTest(emptyCreatorPost)
        })
    
        test ('fails with an invalid year', async () => {
            const invalidYearPost = Object.assign({}, newPlatform)
            invalidYearPost.year = "year"
            
            await invalidParameterPostTest(invalidYearPost)
        })
    })

    describe('PUT /api/platforms/:id', async () => {
        let updatesToPlatform, invalidParameterPutTest
        
        beforeAll(async () => {
            updatesToPlatform = {
                name: 'Nintendo Entertainment System',
                creator: 'Nintendo',
                year: 1983,
                games: []
            }

            invalidParameterPutTest = async (data) => {
                const platformsBeforePut = await platformsInDb()
    
                const response = await api
                    .put(`/api/platforms/${platformsBeforePut[0].id}`)
                    .send(data)
                    .expect(400)
                    .expect('Content-type', /application\/json/)
    
                const platformsAfterPut = await platformsInDb()
    
                expect(response.body.error).toBe('Invalid parameters')
                expect(platformsAfterPut).toEqual(platformsBeforePut)
            }
        })

        test ('succeeds with valid data', async() => {
            const platformsBeforePut = await platformsInDb()
            
            const platformBeforePut = platformsBeforePut[0]
            
            await api
                .put(`/api/platforms/${platformBeforePut.id}`)
                .send(updatesToPlatform)
                .expect(200)
                .expect('Content-type', /application\/json/)
            
            const platformsAfterPut = await platformsInDb()
            expect(platformsAfterPut).toHaveLength(platformsBeforePut.length)

            const ids = platformsAfterPut.map(platform => platform.id)
            const names = platformsAfterPut.map(platform => platform.name)
            const creators = platformsAfterPut.map(platform => platform.creator)
            const years = platformsAfterPut.map(platform => platform.year)

            expect(ids).toContain(platformBeforePut.id)
            expect(names).toContain(updatesToPlatform.name)
            expect(names).not.toContain(platformBeforePut.name)
            expect(creators).toContain(updatesToPlatform.creator)
            expect(creators).not.toContain(platformBeforePut.creator)
            expect(years).toContain(updatesToPlatform.year)
            expect(years).not.toContain(platformBeforePut.year)
        })

        test ('fails with valid data but invalid id', async() => {
            const platformsBeforePut = await platformsInDb()
            const invalidId = await nonExistingId()
            
            const response = await api
                .put(`/api/platforms/${invalidId}`)
                .send(updatesToPlatform)
                .expect(404)
                .expect('Content-type', /application\/json/)

            const platformsAfterPut = await platformsInDb()
    
            expect(response.body.error).toBe('No platform found matching id')
            expect(platformsAfterPut).toEqual(platformsBeforePut)
        })

        test('fails with an empty name', async() => {
            const emptyNamePut = Object.assign({}, updatesToPlatform)
            emptyNamePut.name = ''

            await invalidParameterPutTest(emptyNamePut)
        })

        test('fails with an empty creator', async() => {      
            const emptyCreatorPut = Object.assign({}, updatesToPlatform)
            emptyCreatorPut.creator = ''

            await invalidParameterPutTest(emptyCreatorPut)
        })

        test('fails with an invalid year', async() => {
            const invalidYearPut = Object.assign({}, updatesToPlatform)
            invalidYearPut.year = 'year'

            await invalidParameterPutTest(invalidYearPut)
        })
    })

    afterAll(() => {
        server.close()
    })
})