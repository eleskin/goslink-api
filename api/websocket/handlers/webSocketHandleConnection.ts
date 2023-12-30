import WebSocket from 'ws';
import getParamFromUrl from '../../../services/functions/getIdFromUrl';
import {ObjectId} from 'mongodb';
import http from 'http';
import getCollections from '../services/getCollections';

const webSocketHandleConnection = async (
	ws: WebSocket & { _id: string; roomId: string },
	request: http.IncomingMessage,
) => {
	ws._id = getParamFromUrl(request, '_id');
	ws.roomId = getParamFromUrl(request, 'room_id');
	
	const {roomsCollection} = await getCollections();
	
	const rooms = await roomsCollection.find({
		$or: [{firstUserId: new ObjectId(ws._id)}, {secondUserId: new ObjectId(ws._id)}],
	}).toArray();
	
	ws.send(JSON.stringify({
		type: 'GET_MESSAGES',
		data: {rooms},
	}));
	
	ws.on('message', (payload: any) => {
	
	});
	ws.on('error', () => {
	});
};

export default webSocketHandleConnection;