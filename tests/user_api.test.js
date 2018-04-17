const supertest = require('supertest')
const { app, server } = require('../index')
const User = require('../models/user')
const {
    saveInitialUsers,
    usersInDb,
    nonExistingId,
    findUser,
    user1
} = require('../utils/test_helper')

const api = supertest(app)

describe('When there are initially some users saved', async () => {
    beforeAll(async () => {
        await saveInitialUsers()
    })

    test('all users are returned as JSON by GET /api/platforms', async () => {
        const users = await usersInDb()

        const response = await api
            .get('/api/users')
            .expect(200)
            .expect('Content-type', /application\/json/)

        const body = response.body
        const ids = body.map(user => user.id)
        const usernames = body.map(user => user.username)
        const roles = body.map(user => user.role)

        expect(body).toHaveLength(users.length)
        users.forEach(user => {
            expect(ids).toContain(user.id),
            expect(usernames).toContain(user.username),
            expect(roles).toContain(user.role)
        })
    })

    describe('GET /api/users/:id', async () => {
        test('returns an individual user as JSON', async () => {
            const users = await usersInDb()

            const user = users[0]

            const response = await api
                .get(`/api/users/${user.id}`)
                .expect(200)
                .expect('Content-type', /application\/json/)

            const body = response.body
            expect(JSON.stringify(body.id)).toEqual(JSON.stringify(user.id))
            expect(body.username).toEqual(user.username)
            expect(body.role).toEqual(user.role)
        })

        test('returns status code 400 with malformatted id', async () => {
            const response = await api
                .get('/api/users/Invalid')
                .expect(400)
                .expect('Content-type', /application\/json/)

            expect(response.body.error).toBe('Malformatted user id')
        })

        test('returns status code 404 if no user found matching a valid id', async () => {
            const invalidId = await nonExistingId()

            await api
                .get(`/api/users/${invalidId}`)
                .expect(404)
        })
    })

    describe('POST /api/users', async () => {
        let invalidUserTest

        beforeAll(async () => {
            invalidUserTest = async (data) => {
                const usersBeforePost = await usersInDb()

                const response = await api
                    .post('/api/users')
                    .send(data)
                    .expect(400)
                    .expect('Content-type', /application\/json/)

                const usersAfterPost = await usersInDb()

                expect(response.body.error).toBe('Invalid user parameters')
                expect(usersAfterPost).toEqual(usersBeforePost)
            }
        })

        test('succeeds with valid data', async () => {        
            const newUser = Object.assign({}, user1)
            newUser.role = 'Admin'
            
            const response = await api
                .post('/api/users')
                .send(newUser)
                .expect(200)
                .expect('Content-type', /application\/json/)

            const userAfterPost = await findUser(response.body.id)

            expect(userAfterPost.username).toBe(newUser.username)
            expect(userAfterPost.role).toBe('Member') // New users are assigned to be members, even if they provide role: admin in the HTTP request
        })

        test('fails if username is not unique', async () => {
            const nonUniqueUsername = Object.assign({}, user1)
            nonUniqueUsername.username = 'User1'

            await invalidUserTest(nonUniqueUsername)
        })

        test('fails if username consists of less than 3 characters', async () => {
            const usernameTooShort = Object.assign({}, user1)
            usernameTooShort.username = 'AE'

            await invalidUserTest(usernameTooShort)
        })

        test('fails if no username is provided', async () => {
            const noUsername = Object.assign({}, user1)
            noUsername.username = null

            await invalidUserTest(noUsername)
        })

        test('fails if no password is provided', async () => {
            const noPassword = Object.assign({}, user1)
            noPassword.password = null

            await invalidUserTest(noPassword)
        })

        test('fails if the password is too short', async () => {
            const passwordTooShort = Object.assign({}, user1)
            passwordTooShort.password = 'nope'

            await invalidUserTest(passwordTooShort)
        })
    })

    afterAll(() => {
        server.close()
    })
})