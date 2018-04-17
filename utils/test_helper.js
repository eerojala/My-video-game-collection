const Platform = require('../models/platform')
const Game = require('../models/game')
const User = require('../models/user')

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
        username: 'User1',
        password: 'wordpass',
        role: 'Member'
    },
    {
        username: 'User2',
        password: 'salasana',
        role: 'Admin'
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
    initialGames[1].platform = platforms[1].id
    initialGames[2].platform = platforms[1].id
    const gameObjects = initialGames.map(game => new Game(game))
    const promiseArray = gameObjects.map(game => game.save())
    
    await Promise.all(promiseArray)
}

const addGamesToPlatforms = async () => {
    const platforms = await Platform.find({})
    const games = await gamesInDb()
    
    const playstationGames = [games[0].id]
    const neoGeoGames = [games[1].id, games[2].id]
    platforms[0].games = playstationGames
    platforms[1].games = neoGeoGames
    const promiseArray = platforms.map(platform => platform.save())

    await Promise.all(promiseArray)
}

const saveInitialUsers = async () => {
    await User.remove({})

    const userObjects = initialUsers.map(user => new User(user))
    const promiseArray = userObjects.map(user => user.save())

    await Promise.all(promiseArray)
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
    username: 'User3',
    password: '12345'
}
 
module.exports = {
    saveInitialPlatformsAndGames,
    saveInitialUsers,
    nonExistingId,
    platformsInDb,
    gamesInDb,
    usersInDb,
    findPlatform,
    findGame,
    findUser,
    platform1,
    platform2,
    platform3,
    game1,
    game2,
    game3,
    user1
}