const express = require('express');
const client = require('../../services/client');
const http = require('http');
const WebSocket = require('ws');
const getMessages = require('../../services/functions/getMessages');
const authenticateJWT = require('../../services/functions/authenticateJWT');

const router = express.Router();
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({server});
const users = new Set();

wss.on('connection', async (ws) => {
	await client.connect();
	users.add(ws);
	
	ws.on('message', async (_data) => {
		const data = JSON.parse(_data);
		const messagesCollection = await client.db('main').collection('messages');
		
		if (data.method === 'GET') {
			console.log(data.method);
		} else if (data.method === 'POST') {
			await messagesCollection.insertOne({
				username: data.username,
				conversationalist: data.conversationalist,
				message: data.message,
			});
		}
		
		const messages = JSON.stringify(await getMessages(data.username, data.conversationalist, messagesCollection));
		for(const user of users) {
			user.send(messages);
		}
	});
});

server.listen(8000);

router.post('/dialogs', authenticateJWT, async (req, res) => {
	const {username} = req.body;
	
	const usersCollection = await client.db('main').collection('users');
	const messagesCollection = await client.db('main').collection('messages');
	const dialogsUsernames = (await messagesCollection
		.find({$or: [{username}, {conversationalist: username}]})
		.toArray())
		.map((dialog) => [dialog.username, dialog.conversationalist]);
	
	const usernames = [...new Set(dialogsUsernames.flat())].filter((dialogUsername) => dialogUsername !== username);
	
	const dialogs = await usersCollection
		.find({username: {$in: usernames}}, {projection: {name: 1, username: 1, _id: 0}})
		.toArray();
	
	return res.status(200).send({
		dialogs,
	});
})

router.post('/chat', authenticateJWT, async (req, res) => {
	const {username, conversationalist} = req.body;
	
	// const usersCollection = await client.db('main').collection('users');
	const messagesCollection = await client.db('main').collection('messages');
	const messages = await messagesCollection
		.find({$or: [{username, conversationalist}, {username: conversationalist, conversationalist: username}]})
		.toArray();
	// const dialogsUsernames = (await messagesCollection
	// 	.find({$or: [{username}, {conversationalist: username}]})
	// 	.toArray())
	// 	.map((dialog) => [dialog.username, dialog.conversationalist]);
	//
	// const usernames = [...new Set(dialogsUsernames.flat())].filter((dialogUsername) => dialogUsername !== username);
	//
	// const dialogs = await usersCollection
	// 	.find({username: {$in: usernames}}, {projection: {name: 1, username: 1, _id: 0}})
	// 	.toArray();
	//
	return res.status(200).send({
		messages,
	});
})

module.exports = router;