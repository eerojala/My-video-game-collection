const mongoose = require('mongoose')

const userGameSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User',
        required: true
    },
    game: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Game',
        required: true
    },
    status: {
        type: String,
        enum: ['Completed', 'Beaten', 'Unfinished'],
        required: true
    },
    score: {
        type: Number,
        min: 0,
        max: 5,
        validate: {
            validator: Number.isInteger,
            message: 'Not an integer'
        }
    }
})

userGameSchema.statics.format = (userGame) => {
    return {
        id: userGame.id,
        user: userGame.user,
        game: userGame.game,
        status: userGame.status,
        score: userGame.score
    }
}

const UserGame = mongoose.model('UserGame', userGameSchema)

module.exports = UserGame