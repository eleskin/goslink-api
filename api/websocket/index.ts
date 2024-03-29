import express from 'express';
import https from 'https';
import WebSocket from 'ws';
import getIdFromUrl from '../../services/functions/getIdFromUrl';
import Payload from '../../types/Payload';
import handleMessageWebSocket from './handlers/handleMessageWebSocket';
import * as fs from 'fs';

const app = express();

const server = https.createServer({
	cert: fs.readFileSync(process.env.CERT_PATH ?? ''),
	key: fs.readFileSync(process.env.KEY_PATH ?? ''),
}, (req, res) => {
	console.log("Request");
	res.end("Nice");
}).listen(8000);

const wss = new WebSocket.Server({server});

const activeClients: Map<string, WebSocket> = new Map();

wss.on('connection', (ws: WebSocket & { isAlive: boolean }, request) => {
	const _id = getIdFromUrl(request);
	
	const existingWs = activeClients.get(_id);
	if (!existingWs) {
		activeClients.set(_id, ws);
	}
	
	ws.on('message', async (payload: Payload) => {
		await handleMessageWebSocket(ws, payload, activeClients)
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

wss.on('close', () => {
	clearInterval(interval);
});

export default app;