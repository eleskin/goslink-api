const express = require('express');
const client = require('../../services/client');
const http = require('http');
const WebSocket = require('ws');
const {ObjectId} = require('mongodb');
const sendResponse = require('./services/sendResponse');

const router = express.Router();
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({server});

const handleGetRequest = async (collections, {ws, data}) => {
	const {usersCollection} = collections;
	
	ws.send(JSON.stringify({
		method: data.method,
		conversationalistName: (await usersCollection.findOne({username: data.conversationalist})).name,
	}));
};

const handlePostRequest = async (collections, {roomName, userId, data}) => {
	const {roomsCollection, usersCollection, messagesCollection} = collections;
	
	const room = await roomsCollection.findOne({roomName});
	
	if (room) {
		await messagesCollection.insertOne({
			roomId: room._id,
			text: data.message,
			userId,
		});
		
		sendResponse('NEW_MESSAGE', wss, {room, userId, data});
	} else {
		const [firstUserId, secondUserId] = [
			(await usersCollection.findOne({username: users[0]}))._id,
			(await usersCollection.findOne({username: users[1]}))._id,
		];
		
		const {insertedId} = await roomsCollection.insertOne({
			firstUserId,
			secondUserId,
			roomName,
		});
		
		await messagesCollection.insertOne({
			roomId: insertedId,
			text: data.message,
			userId,
		});
		
		const room = await roomsCollection.findOne({_id: insertedId});
		
		sendResponse('NEW_MESSAGE', wss, {room, userId, data});
	}
};

wss.on('connection', async (ws, request) => {
	await client.connect();
	
	ws._id = new ObjectId(new URL(request.url, `ws://${request.headers.host}`).searchParams.get('_id'));
	
	ws.on('message', async (_data) => {
		const data = JSON.parse(_data);
		const users = [data.username, data.conversationalist].toSorted();
		const roomName = users.join('|');
		
		const roomsCollection = await client.db('main').collection('rooms');
		const usersCollection = await client.db('main').collection('users');
		const messagesCollection = await client.db('main').collection('messages');
		
		const userId = (await usersCollection.findOne({username: data.username}))?._id;
		
		if (!userId) return;
		
		ws.roomName = roomName;
		
		if (data.method === 'GET') {
			await handleGetRequest(
				{usersCollection},
				{ws, data},
			);
		} else if (data.method === 'POST') {
			await handlePostRequest(
				{roomsCollection, usersCollection, messagesCollection},
				{roomName, userId, data},
			);
		}
		
		for (const client1 of wss.clients) {
			if (client1.roomName === ws.roomName) {
				const _id = (await roomsCollection.findOne({roomName: ws.roomName}))?._id;
				const firstUserId = (await roomsCollection.findOne({roomName: ws.roomName}))?.firstUserId;
				const secondUserId = (await roomsCollection.findOne({roomName: ws.roomName}))?.secondUserId;
				if (!_id) return;
				
				const messages = (await messagesCollection.find({roomId: _id}).toArray());
				const conversationalistName = (await usersCollection.findOne({_id: userId.toString() !== firstUserId.toString() ? firstUserId : secondUserId})).name;
				
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

server.listen(8000);

module.exports = router;