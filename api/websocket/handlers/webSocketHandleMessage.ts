import messageService from '../services/messageService';
import WebSocket from 'ws';
import userService from '../services/userService';

const sendResponse = (ws: WebSocket & { _id: string; roomId: string }, wss: WebSocket.Server, payload: string) => {
	for (const client of wss.clients) {
		client.send(payload);
	}
};

const webSocketHandleMessage = async (ws: WebSocket & { _id: string; roomId: string }, wss: WebSocket.Server, payload: {
	type: string;
	data: any
}) => {
	switch (payload?.type?.split('_')?.[1]) {
		case 'MESSAGE':
			sendResponse(ws, wss, await messageService(ws, payload));
			return;
		
		case 'USER':
			sendResponse(ws, wss, await userService(ws, payload));
			return;
	}
};

export default webSocketHandleMessage;