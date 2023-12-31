import WebSocket from 'ws';
import getParamFromUrl from '../../../services/functions/getIdFromUrl';
import {ObjectId} from 'mongodb';
import http from 'http';
import getCollections from '../utils/getCollections';
import webSocketHandleMessage from './webSocketHandleMessage';
import webSocketHandleError from './webSocketHandleError';
import {getMessage} from '../services/messageService';

const webSocketHandleConnection = async (
	ws: WebSocket & { _id: string; roomId: string },
	wss: WebSocket.Server,
	request: http.IncomingMessage,
) => {
	const _id = getParamFromUrl(request, '_id') ?? '';
	const contactId = getParamFromUrl(request, 'contact_id') ?? '';
	
	ws._id = _id;
	
	const {roomsCollection, usersCollection, messagesCollection} = await getCollections();
	
	const roomsFilter = contactId ?
		{
			$or: [
				{$and: [{firstUserId: new ObjectId(_id)}, {secondUserId: new ObjectId(contactId)}]},
				{$and: [{firstUserId: new ObjectId(contactId)}, {secondUserId: new ObjectId(_id)}]},
			],
		} :
		{
			$or: [{firstUserId: new ObjectId(_id)}, {secondUserId: new ObjectId(_id)}],
		};
	
	const rooms = await roomsCollection.find(roomsFilter).toArray();
	
	for (const room of rooms) {
		const contactId = room.firstUserId.toString() === _id.toString() ? room.secondUserId : room.firstUserId;

		room.contactId = contactId;
		room.contactName = (await usersCollection.findOne({_id: contactId}))?.name;

		const messages = messagesCollection.find({
			roomId: room._id,
		}).sort({_id: -1}).limit(1);
		room.lastMessage = (await messages.toArray())[0]?.text;
	}
	
	ws.send(JSON.stringify({
		type: 'GET_ROOMS',
		data: {
			rooms,
			messages: await getMessage(ws),
		},
	}));
	// console.log(getParamFromUrl(request, '_id') ?? '');
	// console.log(getParamFromUrl(request, 'contact_id') ?? '');
	// ws._id = getParamFromUrl(request, '_id') ?? '';
	//
	//
	//
	
	//
	
	//
	
	//
	// ws.on('message', (payload: string) => {
	// 	webSocketHandleMessage(ws, wss, JSON.parse(payload));
	// });
	// ws.on('error', webSocketHandleError);
};

export default webSocketHandleConnection;