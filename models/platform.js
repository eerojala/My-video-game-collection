const mongoose = require('mongoose')

const platformSchema = new mongoose.Schema({
    name: {
        type: String,
        minlength: 1,
        required: true
    },
    creator: {
        type: String,
        minlength: 1,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
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