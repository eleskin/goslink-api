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
	request: http.IncomingMessage,
) => {
	ws._id = getParamFromUrl(request, '_id') ?? '';
	ws.roomId = getParamFromUrl(request, 'room_id') ?? '';
	
	const {roomsCollection, usersCollection, messagesCollection} = await getCollections();
	
	const rooms = await roomsCollection.find({
		$or: [{firstUserId: new ObjectId(ws._id)}, {secondUserId: new ObjectId(ws._id)}],
	}).toArray();
	
	for (const room of rooms) {
		const conversationalistId = room.firstUserId.toString() === ws._id.toString() ? room.secondUserId : room.firstUserId;
		
		room.conversationalist = conversationalistId;
		room.conversationalistName = (await usersCollection.findOne({_id: conversationalistId}))?.name;
		
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
	
	ws.on('message', (payload: string) => {
		webSocketHandleMessage(ws, JSON.parse(payload));
	});
	ws.on('error', webSocketHandleError);
};

export default webSocketHandleConnection;