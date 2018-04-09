const mongoose = require('mongoose')

const gameSchema = new mongoose.Schema({
    name: {
        type: String,
        minlength: 1,
        required: true
    },
    platform: { 
        type: mongoose.Schema.Types.ObjectId, ref: 'Platform',
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
    developers: {
        type: [{
            type: String,
            minlength: 1,
            required: true
        }],
        validate: {
            validator: notEmpty,
            message: 'Must have atleast one developer'
        }
    },
    publishers: [{
        type: String,
        minlength: 1,
        required: false
    }]
})

function notEmpty(val) {
    return val.length > 0
}

gameSchema.statics.format = (game) => {
    return {
        id: game.id,
        name: game.name,
        platform: game.platform,
        year: game.year,
        developers: game.developers,
        publishers: game.publishers
    }
}

const Game = mongoose.model('Game', gameSchema)

module.exports = Game