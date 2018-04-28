const jwt = require('jsonwebtoken')
const bcryptjs = require('bcryptjs')
const User = require('../models/user')

const print = (message) => {
    if (process.env.NODE_ENV !== 'test') {
        console.log(message)
    }
}

const getLoggedInUserId = async (token) => {
    if (!token) {
        return null
    }

    const decodedToken = await jwt.verify(token, process.env.SECRET)

    if (!decodedToken.id) {
        return null
    }

    return decodedToken.id
}

const adminLoggedIn = async (token) => {
    const loggedInUserId = await getLoggedInUserId(token)
    const loggedInUser = await User.findById(loggedInUserId)

    if (!loggedInUser) {
        return false
    }

    return loggedInUser.role === 'Admin'
}

const correctUserLoggedIn = async (token, id) => {
    const loggedInUserId = await getLoggedInUserId(token)
    const loggedInUser = await User.findById(loggedInUserId)

    if (!loggedInUser) {
        return false
    }

    return JSON.stringify(loggedInUserId) === JSON.stringify(id)
}

const hashPassword = async (password) => {
    const salt = await bcryptjs.genSaltSync(10)
    
    return await bcryptjs.hashSync(password, salt)
}


module.exports = { print, getLoggedInUserId, adminLoggedIn, correctUserLoggedIn, hashPassword }