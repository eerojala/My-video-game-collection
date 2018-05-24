const userGamesRouter = require('express').Router()
const UserGame = require('../models/user_game')
const User = require('../models/user')
const Game = require('../models/game')
const { print, correctUserLoggedIn, adminLoggedIn, getLoggedInUserId } = require('../utils/controller_helper')

userGamesRouter.get('/', async (request, response) => {
    try {
        const userGames = await UserGame
            .find({})
            .populate('user', { username: 1, _id: 1 })
            .populate('game', { name: 1 })
            .populate({
                path: 'game', select: { name: 1, platform: 1 }, populate: {
                    path: 'platform', select: { name: 1, _id: 1 }
                }
            })

            response.json(userGames.map(UserGame.format))
    } catch (exception) {
        print(exception)
        response.status(500).json({ error: 'Something went wrong...' })
    }
})

userGamesRouter.post('/', async (request, response) => {
    try {
        const body = request.body

        const loggedInUserId = await getLoggedInUserId(request.token)

        if (!loggedInUserId) {
            return response.status(401).json({ error: 'You must be logged in to add a game to your collection' })
        } 

        const user = await User
            .findById(loggedInUserId)
            .populate('ownedGames', { game: 1 })

        const game = await Game.findById(body.game)

        if (!game) {
            return response.status(400).json({ error: 'No game found matching given game id' })
        }

        const ownedGameIds = user.ownedGames.map(ownedGame => ownedGame.game)

        if (JSON.stringify(ownedGameIds).includes(JSON.stringify(game.id))) {
            return response.status(400).json({ error: 'This user already has the game matching the game id in their collection' })
        }

        const userGame = Object.assign({user: loggedInUserId}, body)
        const newUserGame = new UserGame(userGame)

        const savedUserGame = await newUserGame.save()

        user.ownedGames = user.ownedGames.concat(savedUserGame._id)

        await user.save()

        response.json(UserGame.format(savedUserGame))
    } catch (exception) {
        print(exception)

        if (exception.name === 'ValidationError' || exception.name === 'CastError'){
            response.status(400).json({ error: 'Invalid user game collection entry parameters' })
        } else {
            response.status(500).json({ error: 'Something went wrong...' })
        }
    }
})

userGamesRouter.put('/:id', async (request, response) => {
    try {
        const userGame = await UserGame.findById(request.params.id)

        if (!userGame) {
            return response.status(404).json({ error: 'No user game collection entry found matching id' })
        }

        if (!(await correctUserLoggedIn(request.token, userGame.user) === true || await adminLoggedIn(request.token) === true)) {
            return response.status(401).json({ 
                error: 'Must be logged in either as the user who owns the game or as an admin to update a game collection entry' 
            })
        }

        
        if (request.body.user || request.body.game) {
            return response.status(400).json({ error: 'You are not allowed to change the game or user of a game collection entry' })
        }

        const changesToUserGame = Object.assign({}, request.body)
        
        const updatedUserGame = await UserGame.findByIdAndUpdate(request.params.id, changesToUserGame, { new: true, runValidators: true })

        response.json(UserGame.format(updatedUserGame))
    } catch (exception) {
        print(exception)

        if (exception._message === 'Validation failed' || exception.name === 'CastError') {
            response.status(400).json({ error: 'Invalid user game collection entry parameters' })
        } else {
            response.status(500).json({ error: 'Something went wrong...' })
        }
    }
})

userGamesRouter.delete('/:id', async (request, response) => {
    try {
        const userGame = await UserGame.findById(request.params.id)
        
        if (!userGame) {
            return response.status(404).json({ error: 'No user game collection entry found matching id' })
        }
        
        if (!(await correctUserLoggedIn(request.token, userGame.user) === true || await adminLoggedIn(request.token) === true)) {
            return response.status(401).json({ 
                error: 'To delete an user game collection entry you must be either logged in either as the user who it belongs to or as an admin' 
            })
        }

        await UserGame.findByIdAndRemove(request.params.id)

        const user = await User.findById(userGame.user)

        user.ownedGames = user.ownedGames.filter(game => JSON.stringify(game) !== JSON.stringify(request.params.id))

        await User.findByIdAndUpdate(user.id, user, { new: true, runValidators: true })

        response.status(204).end()
    } catch (exception) {
        print(exception)

        if (exception.name === 'CastError') {
            response.status(400).json({ error: 'Malformatted user game collection entry id' })
        } else {
            response.status(500).json({ error: 'Error, something went wrong' })
        }
    }
})

module.exports = userGamesRouter