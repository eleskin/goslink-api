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
	const {username, conversationalist} = req.body;
	
	const messagesCollection = await client.db('main').collection('messages');
	await messagesCollection.insertOne(req.body);
	const messages = await messagesCollection.find({username, conversationalist}).toArray()
	
	res.send({
		messages,
	});
});

module.exports = router;