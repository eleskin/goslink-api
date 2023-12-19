const express = require('express');
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
	const {email, password} = req.body;
	
	bcrypt.hash(password, saltRounds, async (err, hash) => {
		const usersCollection = await client.db('main').collection('users');
		const users = await usersCollection.find({email}).toArray();
		
		const isExistUser = Boolean(users.length);
		
		if (isExistUser) {
			res.status(400).send({
				message: 'A user with this email address already exists',
			});
		} else {
			const accessToken = jwt.sign({email}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
			const refreshToken = jwt.sign({email}, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '1d'});
			
			await usersCollection.insertOne({...req.body, password: hash, refreshToken});
			
			res.status(201).send({accessToken, refreshToken});
		}
	});
});

router.post('/login', async (req, res) => {
	const {email, password, remember} = req.body;
	
	const usersCollection = await client.db('main').collection('users');
	const users = await usersCollection.find({email}).toArray();
	
	const isExistUser = Boolean(users.length);
	
	if (!isExistUser) {
		res.status(400).send({
			message: 'There is no user with this email address',
		});
	} else {
		
		bcrypt.compare(password, users?.[0]?.password, (err, result) => {
			if (result) {
				const accessToken = jwt.sign({email}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
				const refreshToken = jwt.sign({email}, process.env.REFRESH_TOKEN_SECRET, !remember ? {expiresIn: '1d'} : {});
				
				usersCollection.replaceOne({email}, {...users?.[0], refreshToken});
				
				res.status(200).send({
					accessToken,
					refreshToken,
				});
			} else {
				res.status(400).send({
					message: 'Invalid password',
				});
			}
		});
	}
});

router.post('/refresh-token', (req, res) => {
	const {token} = req.body;
	
	if (!token) {
		return res.sendStatus(401);
	}
	
	jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, async (err, user) => {
		if (err) {
			return res.sendStatus(403);
		}
		
		const usersCollection = await client.db('main').collection('users');
		const users = await usersCollection.find({email: user.email}).toArray();
		
		if (!users?.[0]?.refreshToken === token) {
			return res.sendStatus(403);
		}
		
		const accessToken = jwt.sign(
			{email: user.email},
			process.env.ACCESS_TOKEN_SECRET,
			{expiresIn: '1h'},
		);
		
		res.status(200).send({accessToken});
	});
});

router.post('/logout', (req, res) => {
	const {token} = req.body;
	
	if (!token) {
		return res.sendStatus(401);
	}
	
	jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, async (err, user) => {
		if (err) {
			return res.sendStatus(403);
		}
		
		const usersCollection = await client.db('main').collection('users');
		const users = await usersCollection.find({email: user.email}).toArray();
		
		await usersCollection.replaceOne({email: user.email}, {...users?.[0], refreshToken: null})
		
		res.status(200).send('Logout successful');
	});
	
	return res.sendStatus(401);
});

module.exports = router;