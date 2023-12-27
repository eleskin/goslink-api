import WebSocket from 'ws';
import http from 'http';
import express from 'express';
import handleConnectionWebSocket from './handlers/handleConnectionWebSocket';
import handleMessageWebSocket from './handlers/handleMessageWebSocket';
import handleCloseWebSocket from './handlers/handleCloseWebSocket';

const app = express();
const server = http.createServer(app).listen(8000);
const wss = new WebSocket.Server({server});


const connectedClients: Set<string> = new Set();

wss.on('connection', (ws: WebSocket, request): void => {
	handleConnectionWebSocket();
	
	ws.on('message', handleMessageWebSocket);
	
	ws.on('close', () => handleCloseWebSocket());
});

export default app;