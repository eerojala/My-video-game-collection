const mongoose = require('mongoose')

const platformSchema = new mongoose.Schema({
    name: String,
    creator: String,
    year: Number,
    games: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' }]
})

platformSchema.statics.format = (platform) => {
    return {
        id: platform.id,
        name: platform.name,
        creator: platform.creator,
        year: platform.year,
        games: platform.games
    }
}

const Platform = mongoose.model('Platform', platformSchema)

module.exports = Platform