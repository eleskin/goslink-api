const express = require('express');
const client = require('../../services/client');

const router = express.Router();

router.post('', async (req, res) => {
	const {username, conversationalist} = req.body;
	
	const messagesCollection = await client.db('main').collection('messages');
	const messages = await messagesCollection
		.find({username, conversationalist})
		.toArray();
	
	res.send({
		messages,
	});
});

router.post('/add', async (req, res) => {
	const {username} = req.body;
	
	const usersCollection = await client.db('main').collection('users');
	const users = await usersCollection.find({username}).toArray();
	
	const messagesCollection = await client.db('main').collection('messages');
	const message = await messagesCollection.insertOne({...req.body, name: users?.[0]?.name});
	
	res.send({
		message,
	});
});

module.exports = router;