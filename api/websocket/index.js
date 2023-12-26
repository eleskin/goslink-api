const express = require('express');
const client = require('../../services/client');
const http = require('http');
const WebSocket = require('ws');
const {ObjectId} = require('mongodb');
const createNewMessageResponse = require('./services/createNewMessageResponse');
const createNewUserResponse = require('./services/createNewUserResponse');

const router = express.Router();
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({server});

wss.on('connection', async (ws, request) => {
	await client.connect();
	
	ws._id = new ObjectId(new URL(request.url, `ws://${request.headers.host}`).searchParams.get('_id'));
	
	const usersCollection = await client.db('main').collection('users');
	
	const actualRooms = Array.from(wss.clients).map(client => client.roomName);
	usersCollection.findOne({_id: new ObjectId(ws._id)}).then((response) => {
		const onlineRooms = actualRooms.filter((room) => room?.includes(response.username));
		if (onlineRooms?.length) {
			const onlineUsers = onlineRooms.map((room) => room.split('|').filter((user) => user !== response.username));
			ws.send(JSON.stringify({
				type: 'SET_ONLINE',
				data: {
					conversationalists: [...new Set([...onlineUsers.flat()])],
				},
			}));
		}
	});
	
	ws.on('message', async (_data) => {
		const data = JSON.parse(_data);
		const users = [data.username, data.conversationalist].toSorted();
		const roomName = users.join('|');
		
		const roomsCollection = await client.db('main').collection('rooms');
		const messagesCollection = await client.db('main').collection('messages');
		
		const userId = (await usersCollection.findOne({username: data.username}))?._id;
		
		if (!userId) return;
		
		ws.roomName = roomName;
		
		if (data.type === 'NEW_USER') {
			await createNewUserResponse(
				{usersCollection},
				ws,
				wss,
				data,
			);
		} else if (data.type === 'NEW_MESSAGE') {
			await createNewMessageResponse(
				{roomsCollection, usersCollection, messagesCollection},
				wss,
				{roomName, userId, users, data},
			);
		}
		
		for (const client of Array.from(wss.clients)) {
			if (client.roomName !== ws.roomName) continue;
			
			const _id = (await roomsCollection.findOne({roomName: ws.roomName}))?._id;
			
			if (!_id) continue;
			
			const firstUserId = (await roomsCollection.findOne({roomName: ws.roomName}))?.firstUserId;
			const secondUserId = (await roomsCollection.findOne({roomName: ws.roomName}))?.secondUserId;
			
			const messages = (await messagesCollection.find({roomId: _id}).toArray());
			const conversationalistName = (await usersCollection.findOne({_id: userId.toString() !== firstUserId.toString() ? firstUserId : secondUserId})).name;
			
			for (const message of messages) {
				message.author = (await usersCollection.findOne({_id: message.userId}))?.name;
			}
			
			client.send(JSON.stringify({
				type: 'NEW_MESSAGES',
				conversationalistName,
				messages,
			}));
		}
	});
});

server.listen(8000);

module.exports = router;