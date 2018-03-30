const Platform = require('../models/platform')

const initialPlatforms = [
    {
        name: 'Playstation',
        creator: 'Sony Computer Entertainment',
        year: 1994
    },
    {
        name: 'Neo Geo',
        creator: 'SNK Corporation',
        year: 1990
    }
]

const nonExistingId = async () => {
    const platform = new Platform()

    await platform.save()
    await platform.remove()

    return platform._id.toString()
}

const platformsInDb = async () => {
    const platforms = await Platform.find({})

    return platforms.map(Platform.format)
}

module.exports = {
    initialPlatforms,
    nonExistingId,
    platformsInDb
}