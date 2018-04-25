const supertest = require('supertest')
const { app, server } = require('../index')
const UserGame = require('../models/user_game')
const User = require('../models/user')
const {
    initializeTestDb,
    userGamesInDb,
    gamesInDb,
    usersInDb,
    findUserGame,
    findUser,
    memberCredentials
} = require('../utils/test_helper')

const api = supertest(app)

describe('When there are initially some user game collection entries saved', async () => {
    let userGame, firstUserId, thirdGameId

    beforeAll(async () => {
        await initializeTestDb()
        const users = await usersInDb()
        const games = await gamesInDb()

        firstUserId = users[0].id
        thirdGameId = games[2].id
        userGame = {
            status: 'Unfinished',
            score: 3
        }
    })

    test('all game collection entries are returned by GET /api/usergames', async () => {
        const userGames = await userGamesInDb()

        const response = await api
            .get('/api/usergames')
            .expect(200)
            .expect('Content-type', /application\/json/)

        const ids = response.body.map(userGame => JSON.stringify(userGame.id))
        const users = response.body.map(userGame => JSON.stringify(userGame.user._id))
        const games = response.body.map(userGame => JSON.stringify(userGame.game._id))
        const statuses = response.body.map(userGame => userGame.status)
        const scores = response.body.map(userGame => userGame.score)

        expect(response.body).toHaveLength(userGames.length)
        userGames.forEach(userGame => {
            expect(ids).toContain(JSON.stringify(userGame.id))
            expect(users).toContain(JSON.stringify(userGame.user))
            expect(games).toContain(JSON.stringify(userGame.game))
            expect(statuses).toContain(userGame.status)
            expect(scores).toContain(userGame.score)
        })
    })

    describe('and the user is not logged in', async () => {
        test('POST /api/usergames fails', async () => {
            const userGamesBeforePost = await userGamesInDb()

            const newUserGame = Object.assign({ user: firstUserId, game: thirdGameId }, userGame)

            const response = await api
                .post('/api/usergames')
                .send(newUserGame)
                .expect(401)
                .expect('Content-type', /application\/json/)

            const userGamesAfterPost = await userGamesInDb()

            expect(userGamesAfterPost).toEqual(userGamesBeforePost)
            expect(response.body.error).toBe('You must be logged in to add a game to your collection')
        })
    })

    describe('and the user is logged in with the correct account', async () => {
        let userToken
        
        beforeAll(async () => {
            const response = await api
                .post('/api/login')
                .send(memberCredentials)

            userToken = response.body.token
        })

        describe('POST /api/usergames ', async () => {
            test('succeeds with valid data', async () => {
                const userGamesBeforePost = await userGamesInDb()
    
                const newUserGame = Object.assign({ user: firstUserId, game: thirdGameId }, userGame)
                
                const response = await api
                    .post('/api/usergames')
                    .set('Authorization', 'bearer ' + userToken)
                    .send(newUserGame)
                    .expect(200)
                    .expect('Content-type', /application\/json/)

                const userGamesAfterPost = await userGamesInDb()
                const userAfterPost = await findUser(firstUserId)
                const postedUserGame = await findUserGame(response.body.id)

                expect(userGamesAfterPost).toHaveLength(userGamesBeforePost.length + 1)
                expect(JSON.stringify(postedUserGame.user)).toBe(JSON.stringify(newUserGame.user))
                expect(JSON.stringify(postedUserGame.game)).toBe(JSON.stringify(newUserGame.game))
                expect(postedUserGame.status).toBe(newUserGame.status)
                expect(postedUserGame.score).toBe(newUserGame.score)
                expect(JSON.stringify(userAfterPost.ownedGames)).toContain(JSON.stringify(postedUserGame.id))
            })
        })
    })

    afterAll(() => {
        server.close()
    })
})