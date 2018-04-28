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
    memberCredentials,
    nonExistingId
} = require('../utils/test_helper')

const api = supertest(app)

describe('When there are initially some user game collection entries saved', async () => {
    let userGame

    beforeAll(async () => {
        await initializeTestDb()

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
            const usersBeforePost = await usersInDb()

            const newUserGame = Object.assign({}, userGame)

            const response = await api
                .post('/api/usergames')
                .send(newUserGame)
                .expect(401)
                .expect('Content-type', /application\/json/)

            const userGamesAfterPost = await userGamesInDb()
            const usersAfterPost = await usersInDb()

            expect(userGamesAfterPost).toEqual(userGamesBeforePost)
            expect(response.body.error).toBe('You must be logged in to add a game to your collection')
            expect(usersAfterPost).toEqual(usersBeforePost)
        })
    })

    describe('and the user is logged in with the correct account', async () => {
        let userToken, loggedInUserId, loggedInUser, ownedGameIds, notOwnedGameIds
        
        beforeAll(async () => {
            const response = await api
                .post('/api/login')
                .send(memberCredentials)

            userToken = response.body.token 

            loggedInUser = await User.findOne({ username: memberCredentials.username })

            loggedInUserId = loggedInUser._id

            const userGames = await userGamesInDb()
     
            const ownedGames = userGames.filter(userGame => JSON.stringify(userGame.user) === JSON.stringify(loggedInUserId))
            ownedGameIds = ownedGames.map(ownedGame => ownedGame.game)

            const notOwnedGames = userGames.filter(userGame => JSON.stringify(userGame.user) !== JSON.stringify(loggedInUserId))
            notOwnedGameIds = notOwnedGames.map(notOwnedGame => notOwnedGame.game)
        })

        describe('POST /api/usergames ', async () => {
            let invalidPostTest

            beforeAll(async () => {
                invalidPostTest = async (data, errorMessage = 'Invalid user game parameters')  => {
                    const userGamesBeforePost = await userGamesInDb()
                    const usersBeforePost = await usersInDb()

                    const response = await api
                        .post('/api/usergames')
                        .set('Authorization', 'bearer ' + userToken)
                        .send(data)
                        .expect(400)
                        .expect('Content-type', /application\/json/)

                    const userGamesAfterPost = await userGamesInDb()
                    const usersAfterPost = await usersInDb()

                    expect(response.body.error).toBe(errorMessage)
                    expect(userGamesBeforePost).toEqual(userGamesAfterPost)
                    expect(usersBeforePost).toEqual(usersAfterPost)
                } 
            })

            test('succeeds with valid data', async () => {
                const userGamesBeforePost = await userGamesInDb()
    
                const newUserGame = Object.assign({ game: notOwnedGameIds[0] }, userGame)
                
                const response = await api
                    .post('/api/usergames')
                    .set('Authorization', 'bearer ' + userToken)
                    .send(newUserGame)
                    .expect(200)
                    .expect('Content-type', /application\/json/)

                const userGamesAfterPost = await userGamesInDb()
                const userAfterPost = await findUser(loggedInUserId)
                const postedUserGame = await findUserGame(response.body.id)

                expect(userGamesAfterPost).toHaveLength(userGamesBeforePost.length + 1)
                expect(JSON.stringify(postedUserGame.user)).toBe(JSON.stringify(loggedInUserId))
                expect(JSON.stringify(postedUserGame.game)).toBe(JSON.stringify(newUserGame.game))
                expect(postedUserGame.status).toBe(newUserGame.status)
                expect(postedUserGame.score).toBe(newUserGame.score)
                expect(JSON.stringify(userAfterPost.ownedGames)).toContain(JSON.stringify(postedUserGame.id))
            })

            test('fails with nonexisting game id', async () => {
                const nonExistingGameId = await nonExistingId()

                const nonExistingGame = Object.assign({ game: nonExistingGameId }, userGame)

                await invalidPostTest(nonExistingGame, 'No game found matching given game id')
            })

            test('fails with invalid game id', async () => {
                const invalidGameId = Object.assign({ game: 'Invalid' }, userGame)

                await invalidPostTest(invalidGameId)
            })

            test('fails with no game id provided', async () => {
                const noGame = Object.assign({}, userGame)

                await invalidPostTest(noGame, 'No game found matching given game id')
            })

            test('fails if the user already owns the specified game', async () => {
                const duplicateGame = Object.assign({ game: ownedGameIds[0] }, userGame)

                await invalidPostTest(duplicateGame, 'This user already has the game matching the game id in their collection')
            })

            test('fails with invalid status', async () => {
                const invalidStatus = Object.assign({ game: notOwnedGameIds[1] }, userGame)
                invalidStatus.status = 'Invalid'

                await invalidPostTest(invalidStatus)
            })

            test('fails with no status provided', async () => {
                const noStatus = Object.assign({ game: notOwnedGameIds[1] }, userGame)
                noStatus.status = null

                await invalidPostTest(noStatus)
            })

            test('fails with non-integer score', async () => {
                const nonIntegerScore = Object.assign({ game: notOwnedGameIds[1] }, userGame)
                nonIntegerScore.score = 2.5

                await invalidPostTest(nonIntegerScore)
            })

            test('fails with integer score above 5', async () => {
                const scoreAboveFive = Object.assign({ game: notOwnedGameIds[1] }, userGame)
                scoreAboveFive.score = 6
                
                await invalidPostTest(scoreAboveFive)
            })

            test('fails with score below zero', async () => {
                const scoreBelowZero = Object.assign({ game: notOwnedGameIds[1] }, userGame)
                scoreBelowZero.score = -1

                await invalidPostTest(scoreBelowZero)
            })
        })

        describe('PUT /api/usergames/:id', async () => {
            let invalidPutTest

            beforeAll(async () => {
                invalidPutTest = async (data) => {
                    const userGamesBeforePut = await userGamesInDb()
                    const userGameBeforePut = await findUserGame(loggedInUser.ownedGames[1])

                    const response = await api
                        .put(`/api/userGames/${userGameBeforePut.id}`)
                        .set('Authorization', 'bearer ' + userToken)
                        .send(data)
                        .expect(400)
                        .expect('Content-type', /application\/json/)

                    const userGamesAfterPut = await userGamesInDb()

                    expect(response.body.error).toBe('Invalid user game parameters')
                    expect(JSON.stringify(userGamesAfterPut).toEqual(JSON.stringify(userGamesBeforePut)))
                }
            })

            test('succeeds with valid data', async () => {
                const userGamesBeforePut = await userGamesInDb()
                const userGameBeforePut = await findUserGame(loggedInUser.ownedGames[0])

                const changedUserGame = Object.assign({}, userGameBeforePut)
                changedUserGame.status = userGameBeforePut.status === 'Completed' ? 'Beaten' : 'Completed'
                changedUserGame.score = userGameBeforePut.score === 5 ? 1 : 5

                await api
                    .put(`/api/usergames/${userGameBeforePut.id}`)
                    .set('Authorization', 'bearer ' + userToken)
                    .send(changedUserGame)
                    .expect(200)
                    .expect('Content-type', /application\/json/)

                const userGamesAfterPut = await userGamesInDb()
                const userGameAfterPut = await findUserGame(userGameBeforePut.id)

                expect(userGamesAfterPut).toHaveLength(userGamesBeforePut.length)
                expect(userGameAfterPut).not.toEqual(userGameBeforePut)
                expect(JSON.stringify(userGameAfterPut.id)).not.toEqual(JSON.stringify(userGamesBeforePut.id))
                expect(userGameAfterPut.status).toEqual(changedUserGame.status)
                expect(userGameAfterPut.score).toEqual(changedUserGame.score)
            })
        })
    })

    afterAll(() => {
        server.close()
    })
})