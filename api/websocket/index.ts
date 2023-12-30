import express from 'express';
import http from 'http';
import WebSocket from 'ws';

const app = express();

const server = http.createServer(app).listen(8000);
const wss = new WebSocket.Server({server});

wss.on('connection', async (ws: WebSocket & { _id: string; roomName: string }, request) => {
	ws.on('message', (payload: any) => {
	});
	ws.on('error', () => {
	});
});
wss.on('error', (ws) => {
});

export default app;