const express = require('express');
const client = require('../../services/client');
const http = require('http');
const WebSocket = require('ws');
const getMessages = require('../../services/functions/getMessages');

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

module.exports = router;