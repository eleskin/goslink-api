import WebSocket from 'ws';
import Payload from '../../../types/Payload';
import getCollection from '../../../services/functions/getCollection';
import {ObjectId} from 'mongodb';
import getWsData from '../utils/getWsData';

const groupResponses = [
	'NEW_MESSAGE',
	'DELETE_MESSAGE',
	'EDIT_MESSAGE',
	'ONLINE_USER',
	'OFFLINE_USER',
	'READ_MESSAGE',
	'READ_ALL_MESSAGE',
];

const handleMessageWebSocket = async (ws: WebSocket, payload: Payload, activeClients: Map<string, WebSocket>) => {
	payload = JSON.parse(payload.toString());
	const chatsCollection = await getCollection('chats');
	
	let users = (await chatsCollection.findOne({_id: new ObjectId(payload.data.chatId)}))?.users
		.map((user: ObjectId) => user.toString()) || [];
	
	const data = await getWsData(payload);
	
	if (!data) return;
	
	if (payload.data.chatId && groupResponses.includes(payload.type)) {
		if (!users.length) {
			if ((await chatsCollection.findOne({_id: new ObjectId(payload.data.chatId)}))?.users
				.map((user: ObjectId) => user.toString())) {
				users = (await chatsCollection.findOne({_id: new ObjectId(payload.data.chatId)}))?.users
					.map((user: ObjectId) => user.toString());
			}
		}
		
		for (const [_id, client] of activeClients.entries()) {
			if (users.includes(_id)) {
				client.send(JSON.stringify({
					type: payload.type,
					data,
				}));
			}
		}
	} else {
		ws.send(JSON.stringify({
			type: payload.type,
			data,
		}));
	}
};

export default handleMessageWebSocket;