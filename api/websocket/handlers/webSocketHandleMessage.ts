import messageService from '../services/messageService';

const webSocketHandleMessage = (payload: { type: string; data: any }) => {
	console.log(payload);
	switch (payload?.type?.split('_')?.[0]){
		case 'MESSAGE':
			console.log(1);
			messageService(payload);
			return;
	}
};

export default webSocketHandleMessage;