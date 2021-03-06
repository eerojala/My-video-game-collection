const mongoose = require('mongoose')
const Game = require('./game')

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
        required: true,
        validate: {
            validator: Number.isInteger,
            message: 'Not an integer'
        }
    },
    games: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' }]
})

platformSchema.pre('remove', function(next) {
    Game.remove({platform: this._id}).exec()
    next()
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