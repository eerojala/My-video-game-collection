const jwt = require('jsonwebtoken')
const bcryptjs = require('bcryptjs')
const User = require('../models/user')

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

    const loggedInUser = await User.findById(decodedToken.id)

    return !loggedInUser || loggedInUser.role !== 'Admin'
}

const hashPassword = async (password) => {
    const salt = bcryptjs.genSaltSync(10)
    
    return await bcryptjs.hashSync(password, salt)
}


module.exports = { print, adminLoggedIn, hashPassword }