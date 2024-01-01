import UserService from '../services/UserService';
import {Payload} from '../types';

const handleMessageWebSocket = async (payload: Payload) => {
	const {type, data} = payload;
	const service = type.split('_').at(-1);
	
	switch (service) {
		case 'USER':
			return await UserService.setPayload({type, data});
	}
	
	return null;
};

export default handleMessageWebSocket;