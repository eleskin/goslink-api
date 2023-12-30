import express from 'express';
import client from '../../services/client';
import authenticateJWT from '../../services/functions/authenticateJWT';

const router = express.Router();

router.get('/', authenticateJWT, async (req, res) => {
	const {username} = req.query;
	
	const usersCollection = client.db('main').collection('users');
	const users = await usersCollection.find({username}).toArray();
	
	res.send({
		name: users?.[0]?.name,
		username: users?.[0]?.username,
	});
});

export default router;