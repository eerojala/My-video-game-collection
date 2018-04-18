const jwt = require('jsonwebtoken')
const User = require('../models/User')

const print = (message) => {
    if (process.env.NODE_ENV !== 'test') {
        console.log(message)
    }
}

const adminLoggedIn = async (token) => {
    const decodedToken = jwt.verify(token, process.env.SECRET)

    if (!token || !decodedToken.id) {
        return false
    }

    const user = await User.findById(decodedToken.id)

    return !user || user.role !== 'Admin'
}




module.exports = { print, adminLoggedIn }