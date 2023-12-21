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
	// users.add(ws);
	
	ws.on('message', async (_data) => {
		const data = JSON.parse(_data);
		const users = [data.username, data.conversationalist].toSorted()
		const roomName = users.join('|');
		ws.roomName = roomName;
		
		const roomsCollection = await client.db('main').collection('rooms');
		const usersCollection = await client.db('main').collection('users');
		const messagesCollection = await client.db('main').collection('messages');

		if (data.method === 'GET') {
			console.log(data.method);
		} else if (data.method === 'POST') {
			const room = await roomsCollection.findOne({roomName});
			
			if (room) {
				await messagesCollection.insertOne({
					room: room._id,
					text: data.message,
					user: data.username,
				});
			} else {
				const [firstUser, secondUser] = [
					(await usersCollection.findOne({username: users[0]}))._id,
					(await usersCollection.findOne({username: users[1]}))._id,
				];
				
				const {insertedId} = await roomsCollection.insertOne({
					firstUser,
					secondUser,
					roomName,
				});
				
				await messagesCollection.insertOne({
					room: insertedId,
					text: data.message,
					user: data.username,
				});
			}
		}
		
		for (const client1 of wss.clients) {
			if (client1.roomName === ws.roomName) {
				const {_id} = await roomsCollection.findOne({roomName: ws.roomName});
				const messages = await messagesCollection.find({room: _id}).toArray();
				client1.send(JSON.stringify(messages));
			}
		}
	});
});

server.listen(8000);

router.post('/dialogs', authenticateJWT, async (req, res) => {
	// const {username} = req.body;
	//
	// const usersCollection = await client.db('main').collection('users');
	// const messagesCollection = await client.db('main').collection('messages');
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
	// return res.status(200).send({
	// 	dialogs,
	// });
})

module.exports = router;