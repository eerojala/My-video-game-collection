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
            const platformsBeforePost = await platformsInDb()
    
            const invalidPlatform = newPlatform
            invalidPlatform.name = ""
    
            await api
                .post('/api/platforms')
                .send(invalidPlatform)
                .expect(500)
                .expect('Content-type', /application\/json/)
    
            const platformsAfterPost = await platformsInDb()
    
            expect(platformsBeforePost).toEqual(platformsAfterPost)
        })
    
        test('fails with an empty creator', async () => {
            const platformsBeforePost = await platformsInDb()
    
            const invalidPlatform = newPlatform
            invalidPlatform.creator = ""
    
            await api
                .post('/api/platforms')
                .send(invalidPlatform)
                .expect(500)
                .expect('Content-type', /application\/json/)
    
            const platformsAfterPost = await platformsInDb()
    
            expect(platformsBeforePost).toEqual(platformsAfterPost)
        })
    
        test ('fails with an invalid year', async () => {
            const platformsBeforePost = await platformsInDb()
    
            const invalidPlatform = newPlatform
            invalidPlatform.year = "year"
    
            await api
                .post('/api/platforms')
                .send(invalidPlatform)
                .expect(500)
                .expect('Content-type', /application\/json/)
    
            const platformsAfterPost = await platformsInDb()
    
            expect(platformsBeforePost).toEqual(platformsAfterPost)
        })
    })

    describe('PUT /api/platforms/:id', async () => {
        let updatesToPlatform, invalidParameterUpdateTest
        
        beforeAll(async () => {
            updatesToPlatform = {
                name: 'Nintendo Entertainment System',
                creator: 'Nintendo',
                year: 1983,
                games: []
            }

            invalidParameterUpdateTest = async (data) => {
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
            const invalidUpdate = updatesToPlatform
            invalidUpdate.name = ''

            await invalidParameterUpdateTest(invalidUpdate)
        })

        test('fails with an empty creator', async() => {      
            const invalidUpdate = updatesToPlatform
            invalidUpdate.creator = ''

            await invalidParameterUpdateTest(invalidUpdate)
        })

        test('fails with an invalid year', async() => {
            const invalidUpdate = updatesToPlatform
            invalidUpdate.year = 'year'

            await invalidParameterUpdateTest(invalidUpdate)
        })
    })

    afterAll(() => {
        server.close()
    })
})