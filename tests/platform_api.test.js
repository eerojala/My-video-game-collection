const supertest = require('supertest')
const { app, server } = require('../index')
const Platform = require('../models/platform')
const { initialPlatforms, nonExistingId, platformsInDb } = require('../utils/platform_test_helper')

const api = supertest(app)

describe('When there are initially some platforms saved', async () => {
    beforeAll(async () => {
        await Platform.remove({})

        const platformObjects = initialPlatforms.map(platform => new Platform(platform))
        const promiseArray = platformObjects.map(platform => platform.save())

        await Promise.all(promiseArray)
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

    afterAll(() => {
        server.close()
    })
})