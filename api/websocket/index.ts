import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import getIdFromUrl from '../../services/functions/getIdFromUrl';
import client from '../../services/client';
import {ObjectId} from 'mongodb';

const app = express();

const server = http.createServer(app).listen(8000);
const wss = new WebSocket.Server({server});

wss.on('connection', async (ws: WebSocket & { _id: string; roomName: string }, request) => {
	ws._id = getIdFromUrl(request);
	
	await client.connect();
	
	const messagesCollection = client.db('main').collection('messages');
	const roomsCollection = client.db('main').collection('rooms');
	
	const rooms = await roomsCollection.find({
		$or: [{firstUserId: new ObjectId(ws._id)}, {secondUserId: new ObjectId(ws._id)}],
	}).toArray();
	
	console.log(rooms)
	ws.send(JSON.stringify({
		type: 'GET_MESSAGES',
		data: {
			messages: rooms,
		},
	}));
	
	ws.on('message', (payload: any) => {
	
	});
	ws.on('error', () => {
	});
});
wss.on('error', (ws) => {
});

export default app;