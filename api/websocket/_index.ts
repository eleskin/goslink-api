import WebSocket from 'ws';
import http from 'http';
import express from 'express';
import handleConnectionWebSocket from './handlers/handleConnectionWebSocket';
import handleMessageWebSocket from './handlers/handleMessageWebSocket';
import handleCloseWebSocket from './handlers/handleCloseWebSocket';
import getIdFromUrl from '../../services/functions/getIdFromUrl';
import client from '../../services/client';

const app = express();
const server = http.createServer(app).listen(8000);
const wss = new WebSocket.Server({server});

const connectedClients: Set<string> = new Set();

wss.on('connection', async (ws: WebSocket & {_id: string}, request) => {
	const _id = getIdFromUrl(request);
	ws._id = _id;
	
	await client.connect();
	
	handleConnectionWebSocket();
	
	ws.on('message', handleMessageWebSocket);
	
	ws.on('close', () => handleCloseWebSocket(connectedClients, _id));
});

export default app;