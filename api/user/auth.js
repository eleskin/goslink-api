const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const client = require('../../services/client');

const router = express.Router();
const saltRounds = 10;

router.post('/', (req, res) => {
	const {refreshToken} = req.body;
	const accessToken = req.headers.authorization;
	
	if (!accessToken || !refreshToken) {
		return res.status(401).send();
	}
	
	jwt.verify(accessToken.split(' ')[1], process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
		if (err) {
			return res.status(401).send();
		}
		
		const usersCollection = await client.db('main').collection('users');
		const users = await usersCollection.find({email: user.email}).toArray();
		
		jwt.verify(refreshToken.split(' ')[1], process.env.REFRESH_TOKEN_SECRET, async (err, user) => {
			if (err) {
				return res.status(403).send();
			}
			
			if (users?.[0]?.refreshToken !== refreshToken.split(' ')[1]) {
				return res.status(403).send();
			}
			
			const accessToken = jwt.sign(
				{email: user.email},
				process.env.ACCESS_TOKEN_SECRET,
				{expiresIn: '1h'},
			);
			
			return res.status(200).send({
				accessToken,
				user: {
					name: users?.[0]?.name,
					username: users?.[0]?.username,
					email: users?.[0]?.email,
				},
			});
		});
	});
});

router.post('/register', async (req, res) => {
	const {email, password} = req.body;
	
	bcrypt.hash(password, saltRounds, async (err, hash) => {
		const usersCollection = await client.db('main').collection('users');
		const users = await usersCollection.find({email}).toArray();
		
		const isExistUser = Boolean(users.length);
		
		if (isExistUser) {
			return res.status(400).send({
				message: 'A user with this email address already exists',
			});
		} else {
			const accessToken = jwt.sign({email}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
			const refreshToken = jwt.sign({email}, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '1d'});
			
			await usersCollection.insertOne({...req.body, password: hash, refreshToken});
			
			return res.status(201).send({accessToken, refreshToken});
		}
	});
});

router.post('/login', async (req, res) => {
	const {email, password, remember} = req.body;
	
	const usersCollection = await client.db('main').collection('users');
	const users = await usersCollection.find({email}).toArray();
	
	const isExistUser = Boolean(users.length);
	
	if (!isExistUser) {
		return res.status(400).send({
			message: 'There is no user with this email address',
		});
	} else {
		bcrypt.compare(password, users?.[0]?.password, (err, result) => {
			if (result) {
				const accessToken = jwt.sign({email}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
				const refreshToken = jwt.sign({email}, process.env.REFRESH_TOKEN_SECRET, !remember ? {expiresIn: '1d'} : {});
				
				usersCollection.replaceOne({email}, {...users?.[0], refreshToken});
				
				return res.status(200).send({
					accessToken,
					refreshToken,
				});
			} else {
				return res.status(400).send({
					message: 'Invalid password',
				});
			}
		});
	}
});

router.post('/logout', (req, res) => {
	const {token} = req.body;
	
	if (!token) {
		return res.status(401).send();
	}
	
	jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, async (err, user) => {
		if (err) {
			return res.status(403).send();
		}
		
		const usersCollection = await client.db('main').collection('users');
		const users = await usersCollection.find({email: user.email}).toArray();
		
		await usersCollection.replaceOne({email: user.email}, {...users?.[0], refreshToken: null});
		
		return res.status(200).send('Logout successful');
	});
});

module.exports = router;