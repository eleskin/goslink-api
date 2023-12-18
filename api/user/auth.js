const express = require('express');
const generateAccessToken = require('../../services/functions/generateAccessToken');
const {ServerApiVersion, MongoClient} = require('mongodb');
const router = express.Router();

const client = new MongoClient(process.env.MONGODB_URL, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    
    const users = JSON.stringify(await client.db('main').collection('messages').find().toArray());
    
    const user = users.find((user) => user.email === email && user.password === password);

    const token = generateAccessToken(email);
    res.send(token);

    // res.send();
});

module.exports = router;