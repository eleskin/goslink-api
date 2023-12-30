import getCollections from '../utils/getCollections';
import WebSocket from 'ws';
import {ObjectId} from 'mongodb';

const getMessages = async (ws: WebSocket & { _id: string; roomId: string }) => {
	const objectId = new ObjectId(ws._id);
	
	const {
		messagesCollection,
		roomsCollection,
		usersCollection
	} = await getCollections();
	
	const user = await usersCollection.findOne({_id: objectId});
	
	if (!user) return [];
	
	const room = await roomsCollection.findOne({
		$or: [{firstUserId: objectId}, {secondUserId: objectId}],
	});
	
	if (!room) return [];
	
	const messages = await messagesCollection.find({roomId: new ObjectId(room._id), userId: objectId}).toArray();
	
	for (const message of messages) {
		message.author = user.name ?? '';
	}
	
	return messages;
};

const messageService = async (ws: WebSocket & { _id: string; roomId: string }, payload: {
	type: string;
	data: any
}) => {
	const {type, data} = payload;
	
	switch (type) {
		case 'GET_MESSAGE':
			return JSON.stringify({
				type,
				data: {
					messages: await getMessages(ws),
				},
			});
	}
	
	return JSON.stringify({
		type: 'type',
		data: [],
	});
};

export default messageService;