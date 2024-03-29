if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
  }
  
  let port = process.env.PORT || 3001
  let mongoUrl = process.env.MONGODB_URI
  
  module.exports = { mongoUrl, port }