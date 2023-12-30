import messageService from '../services/messageService';
import WebSocket from 'ws';
import userService from '../services/userService';

const webSocketHandleMessage = async (ws: WebSocket & { _id: string; roomId: string }, payload: { type: string; data: any }) => {
	switch (payload?.type?.split('_')?.[1]){
		case 'MESSAGE':
			ws.send(await messageService(ws, payload));
			return;
			
		case 'USER':
			ws.send(await userService(ws, payload))
			return;
	}
};

export default webSocketHandleMessage;