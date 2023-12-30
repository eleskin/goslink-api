import http from 'http';
import WebSocket from 'ws';
import express from 'express';
import getIdFromUrl from '../../../services/functions/getIdFromUrl';
import client from '../../../services/client';

const app = express();
const server = http.createServer(app).listen(8000);
const wss = new WebSocket.Server({server});

wss.on('connection', async (ws: WebSocket & { _id: string; roomName: string }, request) => {
	ws._id = getIdFromUrl(request);
	await client.connect();
	
	const messagesCollection = client.db('name').collection('messages');
	
	ws.on('message', (payload: any) => {
	
	});
	ws.on('error', () => {
	
	});
});
wss.on('error', (ws) => {

});

export default app;