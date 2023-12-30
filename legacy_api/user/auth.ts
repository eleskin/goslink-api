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
		
		jwt.verify(refreshToken.split(' ')[1], process.env.REFRESH_TOKEN_SECRET ?? '', async (err: any, user: any) => {
			if (err) {
				return res.status(403).send();
			}
			
			const roomsCollection = client.db('main').collection('rooms');
			const usersCollection = client.db('main').collection('users');
			const messagesCollection = client.db('main').collection('messages');
			const users = await usersCollection.find({email: user.email}).toArray();
			
			// const messagesCollection = await client.db('main').collection('messages');
			// const dialogsUsernames = (await messagesCollection
			// 		.find({$or: [{username: users?.[0]?.username}, {conversationalist: users?.[0]?.username}]})
			// 		.toArray())
			// 		.map((dialog) => [dialog.username, dialog.conversationalist]);
			
			// const usernames = [...new Set(dialogsUsernames.flat())].filter((username) => username !== users?.[0]?.username);
			
			// const dialogs = await usersCollection
			// 	.find({username: {$in: usernames}}, {projection: {name: 1, username: 1, _id: 0}})
			// 	.toArray();
			const rooms = await roomsCollection.find({
				$or: [{firstUserId: users?.[0]?._id}, {secondUserId: users?.[0]?._id}],
			}).toArray();
			
			if (users?.[0]?.refreshToken !== refreshToken.split(' ')[1]) {
				return res.status(403).send();
			}
			
			const accessToken = jwt.sign(
				{email: user.email},
				process.env.ACCESS_TOKEN_SECRET ?? '',
				{expiresIn: '1h'},
			);
			
			for (const room of rooms) {
				const conversationalistId = room.firstUserId.toString() === users?.[0]?._id.toString() ? room.secondUserId : room.firstUserId;
				room.conversationalist = conversationalistId;
				room.conversationalistName = (await usersCollection.findOne({_id: conversationalistId}))?.name;
				const messages = messagesCollection.find({roomId: room._id}).sort({_id: -1}).limit(1);
				room.lastMessage = (await messages.toArray())[0]?.text;
			}
			
			return res.status(200).send({
				accessToken,
				rooms,
				user: {
					_id: users?.[0]?._id,
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
	
	bcrypt.hash(password, process.env.SALT_ROUNDS ?? '', async (err, hash) => {
		const usersCollection = await client.db('main').collection('users');
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