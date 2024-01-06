import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import client from '../../services/client';
import authenticateJWT from '../../services/functions/authenticateJWT';
import 'dotenv/config';

const router = express.Router();

router.post('/', (req, res) => {
	const {refreshToken} = req.body;
	const accessToken = req.headers.authorization;
	
	if (!accessToken || !refreshToken) {
		return res.status(401).send();
	}
	
	jwt.verify(accessToken.split(' ')[1], process.env.ACCESS_TOKEN_SECRET ?? '', async (err) => {
		if (err) {
			return res.status(401).send();
		}
		
		jwt.verify(refreshToken.split(' ')[1], process.env.REFRESH_TOKEN_SECRET ?? '', async (err: any, tokenUser: any) => {
			if (err) {
				return res.status(403).send();
			}
			
			const usersCollection = client.db('main').collection('users');
			const user = await usersCollection.findOne({email: tokenUser.email});
			
			if (user?.refreshToken !== refreshToken.split(' ')[1]) {
				return res.status(403).send();
			}
			
			const accessToken = jwt.sign(
				{email: tokenUser.email},
				process.env.ACCESS_TOKEN_SECRET ?? '',
				{expiresIn: '1h'},
			);
			
			return res.status(200).send({
				accessToken,
				user: {
					_id: user?._id,
					name: user?.name,
					username: user?.username,
					email: user?.email,
				},
			});
		});
	});
});

router.post('/register', async (req, res) => {
	const {email, password} = req.body;
	
	bcrypt.hash(password, Number(process.env.SALT_ROUNDS), async (err, hash) => {
		const usersCollection = client.db('main').collection('users');
		const users = await usersCollection.find({email}).toArray();
		
		const isExistUser = Boolean(users.length);
		
		if (isExistUser) {
			return res.status(400).send({
				message: 'A user with this email address already exists',
			});
		} else {
			const accessToken = jwt.sign({email}, process.env.ACCESS_TOKEN_SECRET ?? '', {expiresIn: '1h'});
			const refreshToken = jwt.sign({email}, process.env.REFRESH_TOKEN_SECRET ?? '', {expiresIn: '1d'});
			
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
				const accessToken = jwt.sign({email}, process.env.ACCESS_TOKEN_SECRET ?? '', {expiresIn: '1h'});
				const refreshToken = jwt.sign({email}, process.env.REFRESH_TOKEN_SECRET ?? '', !remember ? {expiresIn: '1d'} : {});
				
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

router.post('/logout', authenticateJWT, (req, res) => {
	const {accessToken} = req.body;
	
	if (!accessToken) {
		return res.status(401).send();
	}
	
	jwt.verify(accessToken.split(' ')[1], process.env.ACCESS_TOKEN_SECRET ?? '', async (err: any, user: any) => {
		if (err) {
			return res.status(403).send();
		}
		
		const usersCollection = await client.db('main').collection('users');
		const users = await usersCollection.find({email: user.email}).toArray();

		await usersCollection.replaceOne({email: user.email}, {...users?.[0], refreshToken: null});

		return res.status(200).send('Logout successful');
	});
});

export default router;