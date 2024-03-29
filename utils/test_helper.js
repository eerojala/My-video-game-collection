const Platform = require('../models/platform')
const Game = require('../models/game')
const User = require('../models/user')
const UserGame = require('../models/user_game')
const { hashPassword } = require('./controller_helper')

const initialPlatforms = [
    {
        name: 'Playstation',
        creator: 'Sony Computer Entertainment',
        year: 1994
    },
    {
        name: 'Neo Geo',
        creator: 'SNK',
        year: 1990
    }
]

const initialGames = [
    {
        name: 'Crash Bandicoot',
        year: 1996,
        developers: ['Naughty Dog'],
        publishers: ['Sony Computer Entertainment']
    },
    {
        name: 'Alundra',
        year: 1998,
        developers: ['Matrix Software'],
        publishers: ['SCEI', 'Working Designs', 'Psygnosis']
    },
    {
        name: 'Baseball Stars 2',
        year: 1992,
        developers: ['SNK'],
        publishers: ['SNK']
    },
    {
        name: 'Neo Turf Masters',
        year: 1996,
        developers: ['Nazca Corporation'],
        publishers: ['SNK']
    }
]

const initialUsers = [
    {
        username: 'notadmin',
        password: 'wordpass',
        role: 'Member'
    },
    {
        username: 'adminguy',
        password: 'salasana',
        role: 'Admin'
    },
    {
        username: 'other',
        password: '12345',
        role: 'Member'
    }
]

const nonExistingId = async () => {
    const platform = new Platform({
        name: 'Xbox',
        creator: 'Microsoft',
        year: 2001
    })

    await platform.save()
    await platform.remove()

    return platform._id.toString()
}

const platformsInDb = async () => {
    const platforms = await Platform.find({})

    return platforms.map(Platform.format)
}

const gamesInDb = async () => {
    const games = await Game.find({})
    
    return games.map(Game.format)
}

const usersInDb = async () => {
    const users = await User.find({})

    return users.map(User.format)
}

const userGamesInDb = async () => {
    const userGames = await UserGame.find({})

    return userGames.map(UserGame.format)
}

const saveInitialPlatformsAndGames = async () => {
    await Platform.remove({})
    await Game.remove({})
    await saveInitialPlatforms()
    await saveInitialGames()
    await addGamesToPlatforms()
}

const saveInitialPlatforms = async () => {
    const platformObjects = initialPlatforms.map(platform => new Platform(platform))
    let promiseArray = platformObjects.map(platform => platform.save())

    await Promise.all(promiseArray)
}

const saveInitialGames = async () => {
    const platforms = await platformsInDb()

    initialGames[0].platform = platforms[0].id
    initialGames[1].platform = platforms[0].id
    initialGames[2].platform = platforms[1].id
    initialGames[3].platform = platforms[1].id
    const gameObjects = initialGames.map(game => new Game(game))
    const promiseArray = gameObjects.map(game => game.save())
    
    await Promise.all(promiseArray)
}

const addGamesToPlatforms = async () => {
    const platforms = await Platform.find({})
    const games = await gamesInDb()
    
    const playstationGames = [games[0].id, games[1].id]
    const neoGeoGames = [games[2].id, games[3].id]
    platforms[0].games = playstationGames
    platforms[1].games = neoGeoGames
    const promiseArray = platforms.map(platform => platform.save())

    await Promise.all(promiseArray)
}

const saveInitialUsers = async () => {
    await User.remove({})

    initialUsers[0].passwordHash = await hashPassword(initialUsers[0].password)
    initialUsers[1].passwordHash = await hashPassword(initialUsers[1].password)
    initialUsers[2].passwordHash = await hashPassword(initialUsers[2].password)

    const userObjects = initialUsers.map(user => new User(user))
    const promiseArray = userObjects.map(user => user.save())

    await Promise.all(promiseArray)
}

const initializeTestDb = async () => {
    await saveInitialPlatformsAndGames()
    await saveInitialUsers()
    await saveInitialUserGames()
}

const saveInitialUserGames = async () => {
    await UserGame.remove({})

    const games = await gamesInDb()
    const user1 = await User.findOne({ username: 'notadmin' })
    const user2 = await User.findOne({ username: 'adminguy' })

    const userGame1 = new UserGame({
        user: user1._id,
        game: games[0].id,
        status: 'Unfinished',
        score: 4
    })

    const userGame2 = new UserGame({
        user: user1._id,
        game: games[1].id,
        status: 'Beaten',
        score: 5
    })

    const userGame3 = new UserGame({
        user: user2._id,
        game: games[2].id,
        status: 'Completed',
        score: 4
    })

    const userGame4 = new UserGame({
        user: user2._id,
        game: games[3].id,
        status: 'Unfinished',
        score: 3
    })

    await userGame1.save()
    await userGame2.save()
    await userGame3.save()
    await userGame4.save()
    
    user1.ownedGames = [userGame1._id, userGame2._id]
    user2.ownedGames = [userGame3._id, userGame4._id]

    await user1.save()
    await user2.save()
}

const findPlatform = async (id) => {
    const platform = await Platform.findById(id)
    
    return Platform.format(platform)
}

const findGame = async (id) => {
    const game = await Game.findById(id)

    return Game.format(game)
}

const findUser = async (id) => {
    const user = await User.findById(id)

    return User.format(user)
}

const findUserGame = async (id) => {
    const userGame = await UserGame.findById(id)

    return UserGame.format(userGame)
}

const getNotOwnedUserGameIds = async (userId) => {
    const userGames = await userGamesInDb()

    const notOwnedUserGames = userGames.filter(userGame => JSON.stringify(userGame.user) !== JSON.stringify(userId))
    return notOwnedUserGames.map(notOwnedUserGame => notOwnedUserGame.id)
}

const platform1 = {
    name: 'Dreamcast',
    creator: 'Sega',
    year: 1998,
    games: []
}

const platform2 = {
    name: 'Nintendo Entertainment System',
    creator: 'Nintendo',
    year: 1983,
    games: []
}

const platform3 = {
    name: 'Steam',
    creator: 'Valve Corporation',
    year: 2003,
    games: []
}

const game1 = {
    name: 'Spyro the Dragon',
    year: 1998,
    developers: ['Insomniac Games'],
    publishers: ['Sony Computer Entertainment', 'Universal Interactive Studios']
}

const game2 = {
    name: 'Digimon World',
    year: 1999,
    developers: ['Bandai', 'Flying Tiger Development'],
    publishers: ['Bandai']
}

const game3 = {
    name: 'The King of Fighters 2000',
    year: 2000,
    developers: ['SNK'],
    publishers: ['SNK']
}

const user1 = {
    username: 'User1',
    password: '12345'
}

const memberCredentials = {
    username: initialUsers[0].username,
    password: initialUsers[0].password
}

const adminCredentials = {
    username: initialUsers[1].username,
    password: initialUsers[1].password
}

const otherCredentials = {
    username: initialUsers[2].username,
    password: initialUsers[2].password
}
 
module.exports = {
    saveInitialPlatformsAndGames,
    saveInitialUsers,
    initializeTestDb,
    nonExistingId,
    platformsInDb,
    gamesInDb,
    usersInDb,
    userGamesInDb,
    findPlatform,
    findGame,
    findUser,
    findUserGame,
    getNotOwnedUserGameIds,
    platform1,
    platform2,
    platform3,
    game1,
    game2,
    game3,
    user1,
    memberCredentials,
    adminCredentials,
    otherCredentials
}