const express = require('express');
const client = require('../../services/client');
const http = require('http');
const WebSocket = require('ws');

const router = express.Router();
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({server});

wss.on('connection', async (ws) => {
	await client.connect();
	
	ws.on('message', async (_data) => {
		const data = JSON.parse(_data);
		const users = [data.username, data.conversationalist].toSorted();
		const roomName = users.join('|');
		
		ws.roomName = roomName;
		
		const roomsCollection = await client.db('main').collection('rooms');
		const usersCollection = await client.db('main').collection('users');
		const messagesCollection = await client.db('main').collection('messages');
		
		const userId = (await usersCollection.findOne({username: data.username}))?._id;
		
		if (!userId) return;
		
		if (data.method === 'GET') {
			ws.send(JSON.stringify({
				method: data.method,
				conversationalistName: (await usersCollection.findOne({username: data.conversationalist})).name,
			}));
		} else if (data.method === 'POST') {
			const room = await roomsCollection.findOne({roomName});
			
			if (room) {
				await messagesCollection.insertOne({
					roomId: room._id,
					text: data.message,
					userId,
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
					roomId: insertedId,
					text: data.message,
					userId,
				});
			}
		}
		
		for (const client1 of wss.clients) {
			if (client1.roomName === ws.roomName) {
				const _id = (await roomsCollection.findOne({roomName: ws.roomName}))?._id;
				const firstUser = (await roomsCollection.findOne({roomName: ws.roomName}))?.firstUser;
				const secondUser = (await roomsCollection.findOne({roomName: ws.roomName}))?.secondUser;
				if (!_id) return;
				
				const messages = (await messagesCollection.find({roomId: _id}).toArray());
				const conversationalistName = (await usersCollection.findOne({_id: userId.toString() !== firstUser.toString() ? firstUser : secondUser})).name;
				
				for (const message of messages) {
					message.author = (await usersCollection.findOne({_id: message.userId}))?.name;
				}
				client1.send(JSON.stringify({
					conversationalistName,
					messages,
				}));
			}
		}
	});
});

module.exports = router;