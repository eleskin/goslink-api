import WebSocket from 'ws';
import http from 'http';
import express from 'express';

type webSocketResponseMessagesTypes = 'NEW_MESSAGE' | 'GET_MESSAGES' | 'EDIT_MESSAGE' | 'DELETE_MESSAGE';
type webSocketResponseUserTypes = '';

interface MessageData {
	type: webSocketResponseMessagesTypes;
}

const app = express();
const server = http.createServer(app).listen(8000);
const wss = new WebSocket.Server({server});

const handleConnectionWebSocket = () => {
};

const handleMessageWebSocket = (_data: string) => {
	const data: MessageData = JSON.parse(_data);
	
	const handlers: { [key in webSocketResponseMessagesTypes]: Function } = {
		NEW_MESSAGE: () => {},
		GET_MESSAGES: () => {},
		EDIT_MESSAGE: () => {},
		DELETE_MESSAGE: () => {},
	};
}

const handleCloseWebSocket = () => {};

wss.on('connection', (ws: WebSocket, request): void => {
	handleConnectionWebSocket();
	
	ws.on('message', handleMessageWebSocket);
	
	ws.on('close',handleCloseWebSocket);
});

export default app;