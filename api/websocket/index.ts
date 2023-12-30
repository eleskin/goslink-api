import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import client from '../../services/client';
import {ObjectId} from 'mongodb';
import getParamFromUrl from '../../services/functions/getIdFromUrl';

const app = express();

const server = http.createServer(app).listen(8000);
const wss = new WebSocket.Server({server});

wss.on('connection', async (ws: WebSocket & { _id: string; roomId: string }, request) => {
	ws._id = getParamFromUrl(request, '_id');
	ws.roomId = getParamFromUrl(request, 'room_id');
	
	await client.connect();
	
	const messagesCollection = client.db('main').collection('messages');
	const roomsCollection = client.db('main').collection('rooms');
	
	const rooms = await roomsCollection.findOne({_id: new ObjectId(ws.roomId)});
	
	console.log(rooms)
	ws.send(JSON.stringify({
		type: 'GET_MESSAGES',
		data: {rooms},
	}));
	
	ws.on('message', (payload: any) => {
	
	});
	ws.on('error', () => {
	});
});
wss.on('error', (ws) => {
});

export default app;