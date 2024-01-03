import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import handleMessageWebSocket from './handlers/handleMessageWebSocket';
import {Payload} from './types';
import getIdFromUrl from '../../services/functions/getIdFromUrl';

const app = express();

const server = http.createServer(app).listen(8000);
const wss = new WebSocket.Server({server});

const activeClients: Map<string, WebSocket> = new Map();

wss.on('connection', (ws: WebSocket & { isAlive: boolean }, request) => {
	const _id = getIdFromUrl(request);
	
	const existingWs = activeClients.get(_id);
	if (!existingWs) {
		activeClients.set(_id, ws);
	}
	
	ws.on('message', async (payload: Payload) => {
		payload = JSON.parse(payload.toString());
		const data = await handleMessageWebSocket(payload);
		
		if (!data) return;
		
		if (['NEW_MESSAGE', 'DELETE_MESSAGE', 'EDIT_MESSAGE', 'ONLINE_USER', 'OFFLINE_USER'].includes(payload.type)) {
			for (const [_id, client] of activeClients.entries()) {
				if (_id === payload.data.userId || _id === payload.data.contactId) {
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
	
	ws.on('close', () => {
		activeClients.delete(_id);
	});
	
	ws.isAlive = true;
	ws.on('error', console.error);
	ws.on('pong', () => ws.isAlive = true);
});

const interval = setInterval(() => {
	wss.clients.forEach((ws: any) => {
		if (!ws.isAlive) return ws.terminate();
		
		ws.isAlive = false;
		ws.ping();
	});
}, 30000);

wss.on('close', function close() {
	clearInterval(interval);
});

export default app;