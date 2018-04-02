const mongoose = require('mongoose')

const gameSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    platform: { 
        type: mongoose.Schema.Types.ObjectId, ref: 'Platform',
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    developer: {
        type: String,
        required: true
    },
    publisher: String
})

gameSchema.statics.format = (game) => {
    return {
        id: game.id,
        name: game.name,
        platform: game.platform,
        year: game.year,
        developer: game.developer,
        publisher: game.publisher
    }
}

const Game = mongoose.model('Game', gameSchema)

module.exports = Game