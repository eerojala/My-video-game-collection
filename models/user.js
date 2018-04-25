const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        minlength: 3,
        unique: true,
        required: true
    },
    passwordHash: String,
    role: {
       type: String,
       enum: ['Admin', 'Member'],
       required: true
    },
    ownedGames: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserGame' }]
})

userSchema.statics.format = (user) => {
    return {
        id: user.id,
        username: user.username,
        role: user.role,
        ownedGames: user.ownedGames
    }
}

const User = mongoose.model('User', userSchema)

module.exports = User