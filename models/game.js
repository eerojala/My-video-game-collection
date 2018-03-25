const mongoose = require('mongoose')

const gameSchema = new mongoose.Schema({
    name: String,
    platform: { type: mongoose.Schema.Types.ObjectId, ref: 'Platform' },
    year: Number,
    developer: String,
    publisher: String
})

gameSchema.statics.format = (game) => {
    return {
        id: game.id,
        name: game.name,
        year: game.year,
        developer: game.developer,
        publisher: game.publisher
    }
}

const Game = mongoose.model('Game', gameSchema)

module.exports = Game