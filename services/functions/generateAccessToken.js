const jwt = require('jsonwebtoken');

const generateAccessToken = (email) => jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});

module.exports = generateAccessToken;