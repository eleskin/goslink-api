import UserService from '../services/UserService';
import {Payload} from '../types';
import MessageService from '../services/MessageService';
import RoomService from '../services/RoomService';

const handleMessageWebSocket = async (payload: Payload) => {
	const {type, data} = payload;
	const service = type.split('_').at(-1);
	
	switch (service) {
		case 'USER':
			return await UserService.setPayload(payload);
		
		case 'MESSAGE':
			return await MessageService.setPayload(payload)
		
		case 'ROOM':
			return await RoomService.setPayload(payload)
	}
	
	return null;
};

export default handleMessageWebSocket;