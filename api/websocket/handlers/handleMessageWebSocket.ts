import {webSocketResponseMessagesTypes} from '../types';
import MessageData from '../interfaces/MessageData';

const messageHandlers: { [key in webSocketResponseMessagesTypes]: Function } = {
	NEW_MESSAGE: () => {},
	GET_MESSAGES: () => {},
	EDIT_MESSAGE: () => {},
	DELETE_MESSAGE: () => {},
};

const handleMessageWebSocket = (_data: string) => {
	const data: MessageData = JSON.parse(_data);
	
	
}

export default handleMessageWebSocket;