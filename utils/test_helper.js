const Platform = require('../models/platform')
const Game = require('../models/game')

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
        developer: 'Naughty Dog',
        publisher: 'Sony Computer Entertainment'
    },
    {
        name: 'Baseball Stars 2',
        year: 1992,
        developer: 'SNK',
        publisher: 'SNK'
    },
    {
        name: 'Neo Turf Masters',
        year: 1996,
        developer: 'Nazca Corporation',
        publisher: 'SNK'
    }
]

const nonExistingPlatformId = async () => {
    const platform = new Platform()

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
 
module.exports = {
    saveInitialPlatformsAndGames,
    nonExistingPlatformId,
    platformsInDb,
    gamesInDb
}