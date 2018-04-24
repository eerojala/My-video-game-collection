const jwt = require('jsonwebtoken')
const bcryptjs = require('bcryptjs')
const User = require('../models/user')

const print = (message) => {
    if (process.env.NODE_ENV !== 'test') {
        console.log(message)
    }
}

const getLoggedInUser = async (token) => {
    if (!token) {
        return null
    }

    const decodedToken = await jwt.verify(token, process.env.SECRET)

    if (!decodedToken.id) {
        return null
    }

    return await User.findById(decodedToken.id)
}

const adminLoggedIn = async (token) => {
    const loggedInUser = await getLoggedInUser(token)

    if (!loggedInUser) {
        return false
    }

    return loggedInUser.role === 'Admin'
}

const correctUserLoggedIn = async (token, id) => {
    const loggedInUser = await getLoggedInUser(token)

    if (!loggedInUser) {
        return false
    }

    return loggedInUser.id === id
}

const hashPassword = async (password) => {
    const salt = await bcryptjs.genSaltSync(10)
    
    return await bcryptjs.hashSync(password, salt)
}


module.exports = { print, adminLoggedIn, correctUserLoggedIn, hashPassword }