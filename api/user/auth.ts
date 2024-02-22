import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authenticateJWT from '../../services/functions/authenticateJWT';
import 'dotenv/config';
import getCollection from '../../services/functions/getCollection';
import User from '../../types/User';

const router = express.Router();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET ?? '';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET ?? '';

router.get('/', (req, res) => {
	res.send('Hello');
});

router.post('/', (req, res) => {
	const refreshToken: string = req.body.refreshToken;
	const accessToken = req.headers.authorization;
	
	if (!accessToken || !refreshToken) {
		return res.status(401).send();
	}
	
	jwt.verify(accessToken.split(' ')[1], ACCESS_TOKEN_SECRET, async (err) => {
		if (err) {
			return res.status(401).send();
		}
		
		jwt.verify(refreshToken.split(' ')[1], REFRESH_TOKEN_SECRET, async (err: any, tokenUser: any) => {
			if (err) {
				return res.status(403).send();
			}
			
			const usersCollection = await getCollection('users');
			const user = await usersCollection.findOne<User>({email: tokenUser.email});
			
			if (user?.refreshToken !== refreshToken.split(' ')[1]) {
				return res.status(403).send();
			}
			
			const accessToken = jwt.sign(
				{email: tokenUser.email},
				ACCESS_TOKEN_SECRET,
				{expiresIn: '1h'},
			);
			
			return res.status(200).send({
				accessToken,
				user: {
					_id: user._id,
					name: user.name,
					username: user.username,
					email: user.email,
				},
			});
		});
	});
});

router.post('/register', async (req, res) => {
	const email: string = req.body.email;
	const password: string = req.body.password;
	
	bcrypt.hash(password, Number(process.env.SALT_ROUNDS), async (err, hash) => {
		const usersCollection = await getCollection('users');
		const user = await usersCollection.findOne<User>({email});
		
		if (user) {
			return res.status(400).send({
				message: 'A user with this email address already exists',
			});
		} else {
			const accessToken = jwt.sign({email}, ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
			const refreshToken = jwt.sign({email}, REFRESH_TOKEN_SECRET, {expiresIn: '1d'});
			
			await usersCollection.insertOne({...req.body, password: hash, refreshToken});
			
			return res.status(201).send({accessToken, refreshToken});
		}
	});
});

router.post('/login', async (req, res) => {
	const email: string = req.body.email;
	const password: string = req.body.password;
	const remember: string = req.body.remember;
	
	const usersCollection = await getCollection('users');
	const user = await usersCollection.findOne<User>({email});
	
	if (!user) {
		return res.status(400).send({
			message: 'There is no user with this email address',
		});
	} else {
		bcrypt.compare(password, user.password, (err, result) => {
			if (result) {
				const accessToken = jwt.sign({email}, ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
				const refreshToken = jwt.sign({email}, REFRESH_TOKEN_SECRET, !remember ? {expiresIn: '1d'} : {});
				
				usersCollection.replaceOne({email}, {...user, refreshToken});
				
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
	const accessToken: string = req.body.accessToken;
	
	if (!accessToken) {
		return res.status(401).send();
	}
	
	jwt.verify(accessToken.split(' ')[1], ACCESS_TOKEN_SECRET, async (err: any, tokenUser: any) => {
		if (err) {
			return res.status(403).send();
		}
		
		const usersCollection = await getCollection('users');
		const user = await usersCollection.findOne<User>({email: tokenUser.email});

		await usersCollection.replaceOne({email: tokenUser.email}, {...user, refreshToken: null});

		return res.status(200).send('Logout successful');
	});
});

export default router;