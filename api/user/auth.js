const express = require('express');
const generateAccessToken = require('../../services/functions/generateAccessToken');
const {ServerApiVersion, MongoClient} = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();
const saltRounds = 10;

const client = new MongoClient(process.env.MONGODB_URL, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

router.post('/register', async (req, res) => {
	const { email, password } = req.body;
	
	bcrypt.hash(password, saltRounds, async (err, hash) => {
		const usersCollection = await client.db('main').collection('users');
		const users = await usersCollection.find().toArray();
		
		const isExistUser = Boolean(users.find((user) => user.email === email));
		
		if (isExistUser) {
			res.status(400).send({
				message: 'A user with this email address already exists',
			});
		} else {
			await usersCollection.insertOne({...req.body, password: hash});
			
			const accessToken = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET);
			res.status(201).send({accessToken});
		}
	});
});

module.exports = router;