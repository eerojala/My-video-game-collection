const mongoose = require('mongoose')

const collectionItemSchema = new mongoose.Schema({
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
        max: 5
    }
})

collectionItemSchema.statics.format = (collectionItem) => {
    return {
        id: collectionItem.id,
        user: collectionItem.user,
        game: collectionItem.game,
        status: collectionItem.status,
        score: collectionItem.score
    }
}

const CollectionItem = mongoose.model('CollectionItem', collectionItemSchema)

model.exports = CollectionItem