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
    
            const platformsAfterPost = await platformsInDb()
    
            expect(platformsBeforePost).toEqual(platformsAfterPost)
        })
    
        test ('fails with a non-number year', async () => {
            const platformsBeforePost = await platformsInDb()
    
            const invalidPlatform = newPlatform
            invalidPlatform.year = "year"
    
            await api
                .post('/api/platforms')
                .send(invalidPlatform)
                .expect(500)
    
            const platformsAfterPost = await platformsInDb()
    
            expect(platformsBeforePost).toEqual(platformsAfterPost)
        })
    })
    
    afterAll(() => {
        server.close()
    })
})