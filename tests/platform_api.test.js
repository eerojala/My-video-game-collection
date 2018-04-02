const supertest = require('supertest')
const { app, server } = require('../index')
const Platform = require('../models/platform')
const { saveInitialPlatformsAndGames, nonExistingPlatformId, platformsInDb } = require('../utils/test_helper')

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

    afterAll(() => {
        server.close()
    })
})