import express from 'express';
import client from '../../services/client';
import http from 'http';
import WebSocket from 'ws';
import {ObjectId} from 'mongodb';
import createNewMessageResponse from './services/createNewMessageResponse';
import createNewUserResponse from './services/createNewUserResponse';
import createDeleteMessageResponse from './services/createDeleteMessageResponse';

const app = express();
const server = http.createServer(app).listen(8000);
const wss = new WebSocket.Server({server});

const connectedClients = new Set();

wss.on('connection', async (ws: any, request) => {
	await client.connect();
	
	ws._id = new ObjectId(new URL(request.url ?? '', `ws://${request.headers.host}`).searchParams.get('_id') ?? '');
	
	const usersCollection = client.db('main').collection('users');
	
	const actualRooms = Array.from(wss.clients).map((client: any) => client.roomName);
	usersCollection.findOne({_id: new ObjectId(ws._id)}).then(async (response) => {
		if (connectedClients.has(response?._id.toString())) {
			return;
		}
		
		const onlineRooms = actualRooms.filter((room) => room?.includes(response?.username)).map((room) => room.split('|'));
		
		if (onlineRooms?.length) {
			for (const roomsUsers of onlineRooms) {
				const [firstUserUsername, secondUserUsername] = roomsUsers;
				
				const firstUser = await usersCollection.findOne({username: firstUserUsername});
				const secondUser = await usersCollection.findOne({username: secondUserUsername});
				
				const firstUserId = firstUser?._id;
				const secondUserId = secondUser?._id;
				
				if (connectedClients.has(firstUserId?.toString()) && connectedClients.has(secondUserId?.toString())) {
					ws.send(JSON.stringify({
						type: 'SET_ONLINE',
						data: {
							conversationalists: [firstUser?.username, secondUser?.username],
						},
					}));
				} else if (connectedClients.has(firstUserId?.toString())) {
					ws.send(JSON.stringify({
						type: 'SET_ONLINE',
						data: {
							conversationalist: firstUser?.username,
						},
					}));
				} else if (connectedClients.has(secondUserId?.toString())) {
					ws.send(JSON.stringify({
						type: 'SET_ONLINE',
						data: {
							conversationalist: secondUser?.username,
						},
					}));
				}
			}
		}
		
		connectedClients.add(ws._id.toString());
	});
	
	ws.on('message', async (_data: any) => {
		const data = JSON.parse(_data);
		
		const users = [data.username, data.conversationalist];
		users.sort();
		
		const roomName = users.join('|');
		
		const roomsCollection = client.db('main').collection('rooms');
		const messagesCollection = client.db('main').collection('messages');
		
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
		} else if (data.type === 'DELETE_MESSAGE') {
			await createDeleteMessageResponse(
				{messagesCollection},
				wss,
				data,
			);
		}
		
		for (const client of Array.from(wss.clients)) {
			if ((client as any).roomName !== ws.roomName) continue;
			
			const _id = (await roomsCollection.findOne({roomName: ws.roomName}))?._id;
			
			if (!_id) continue;
			
			const firstUserId = (await roomsCollection.findOne({roomName: ws.roomName}))?.firstUserId;
			const secondUserId = (await roomsCollection.findOne({roomName: ws.roomName}))?.secondUserId;
			
			const messages = (await messagesCollection.find({roomId: _id}).toArray());
			const conversationalistName = (await usersCollection.findOne({_id: userId.toString() !== firstUserId.toString() ? firstUserId : secondUserId}))?.name;
			
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
	
	ws.on('close', () => connectedClients.delete(ws._id.toString()));
});

export default app;