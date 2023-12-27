import express from 'express';
import client from '../../services/client';
import http from 'http';
import WebSocket from 'ws';
import createNewMessageResponse from './services/createNewMessageResponse';
import createNewUserResponse from './services/createNewUserResponse';
import createDeleteMessageResponse from './services/createDeleteMessageResponse';
import getIdFromUrl from '../../services/functions/getIdFromUrl';
import handleConnectionWebSocket from './handlers/handleConnectionWebSocket';
import handleCloseWebSocket from './handlers/handleCloseWebSocket';

const app = express();
const server = http.createServer(app).listen(8000);
const wss = new WebSocket.Server({server});

const connectedClients: Set<string> = new Set();

wss.on('connection', async (ws: any, request) => {
	const _id = getIdFromUrl(request);
	ws._id = _id;
	
	await client.connect();
	await handleConnectionWebSocket(client, wss, ws, connectedClients);

	ws.on('message', async (_data: any) => {
		const data = JSON.parse(_data);
		
		const users = [data.username, data.conversationalist];
		users.sort();
		
		const roomName = users.join('|');
		
		const usersCollection = client.db('main').collection('users');
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
	
	ws.on('close', () => handleCloseWebSocket(connectedClients, _id));
});

export default app;