import http from 'http';
import WebSocket from 'ws';
import express from 'express';

const app = express();
const server = http.createServer(app).listen(8000);
const wss = new WebSocket.Server({server});

wss.on('connection', (ws) => {
	ws.on('message', (payload: any) => {
	
	});
	ws.on('error', () => {
	
	});
});
wss.on('error', (ws) => {

});

export default app;