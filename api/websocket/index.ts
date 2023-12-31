import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import webSocketHandleConnection from './handlers/webSocketHandleConnection';
import webSocketHandleClose from './handlers/webSocketHandleClose';

const app = express();

const server = http.createServer(app).listen(8000);
const wss = new WebSocket.Server({server});

wss.on('connection', async (ws: WebSocket & { _id: string; roomId: string }, payload) => {
	await webSocketHandleConnection(ws, wss, payload);
});
wss.on('close', webSocketHandleClose);

export default app;