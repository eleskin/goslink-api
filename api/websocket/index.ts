import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import handleMessageWebSocket from './handlers/handleMessageWebSocket';
import {Payload} from './types';

const app = express();

const server = http.createServer(app).listen(8000);
const wss = new WebSocket.Server({server});

wss.on('connection', (ws) => {
	ws.on('message', async (payload: Payload) => {
		payload = JSON.parse(payload.toString());
		const data = await handleMessageWebSocket(payload);
		
		if (!data) return;
		
		console.log(JSON.stringify({
			type: payload.type,
			data,
		}));
		ws.send(JSON.stringify({
			type: payload.type,
			data,
		}));
	});
});
wss.on('close', () => {
});

export default app;