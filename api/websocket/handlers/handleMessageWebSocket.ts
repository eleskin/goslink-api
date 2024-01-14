import UserService from '../services/UserService';
import {Payload} from '../types';
import MessageService from '../services/MessageService';
import ChatService from '../services/ChatService';

const handleMessageWebSocket = async (payload: Payload) => {
	const {type} = payload;
	const service = type.split('_').at(-1);
	
	switch (service) {
		case 'USER':
			return await UserService.setPayload(payload);
		
		case 'MESSAGE':
			return await MessageService.setPayload(payload)
		
		case 'CHAT':
			return await ChatService.setPayload(payload)
	}
	
	return null;
};

export default handleMessageWebSocket;