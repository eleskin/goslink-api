import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import handleMessageWebSocket from './handlers/handleMessageWebSocket';
import {Payload} from './types';
import getIdFromUrl from '../../services/functions/getIdFromUrl';

const app = express();

const server = http.createServer(app).listen(8000);
const wss = new WebSocket.Server({server});

wss.on('connection', (ws: WebSocket & { _id: string }, request) => {
	ws._id = getIdFromUrl(request);
	
	ws.on('message', async (payload: Payload) => {
		payload = JSON.parse(payload.toString());
		const data = await handleMessageWebSocket(payload);
		
		if (!data) return;
		
		if (payload.data?.userId && payload.data?.contactId) {
			for (const client of wss.clients) {
				if ((client as any)._id === payload.data.userId || (client as any)._id === payload.data.contactId) {
					client.send(JSON.stringify({
						type: payload.type,
						data,
					}));
				}
			}
		} else {
			ws.send(JSON.stringify({
				type: payload.type,
				data,
			}));
		}
		
		
	});
});
wss.on('close', () => {
});

export default app;