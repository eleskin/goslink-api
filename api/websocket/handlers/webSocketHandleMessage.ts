import messageService from '../services/messageService';

const webSocketHandleMessage = (payload: { type: string; data: any }) => {
	switch (payload?.type?.split('_')?.[0]){
		case 'MESSAGE':
			messageService(payload);
			return;
	}
};

export default webSocketHandleMessage;