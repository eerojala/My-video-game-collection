const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        minlength: 3,
        required: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    role: {
       type: String,
       enum: ['Admin', 'User'],
       required: true
    }
})

userSchema.statics.format = (user) => {
    return {
        id: user.id,
        username: user.username,
        role: user.role
    }
}

const User = mongoose.model('User, userSchema')

module.exports = User