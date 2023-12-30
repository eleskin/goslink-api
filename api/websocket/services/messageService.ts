import getCollections from '../utils/getCollections';
import WebSocket from 'ws';
import {ObjectId} from 'mongodb';

const getMessage = async (ws: WebSocket & { _id: string; roomId: string }) => {
	const userObjectId = new ObjectId(ws._id);
	
	const {
		messagesCollection,
		roomsCollection,
		usersCollection,
	} = await getCollections();
	
	const user = await usersCollection.findOne({_id: userObjectId});
	
	if (!user) return [];
	
	const room = await roomsCollection.findOne({
		$or: [{firstUserId: userObjectId}, {secondUserId: userObjectId}],
	});
	
	if (!room) return [];
	
	const messages = await messagesCollection.find({
		roomId: new ObjectId(room._id),
		userId: userObjectId,
	}).toArray();
	
	for (const message of messages) {
		message.author = user.name ?? '';
	}
	
	return messages;
};

const newMessage = async (ws: WebSocket & { _id: string; roomId: string }, payload: { type: string, data: any }) => {
	const userObjectId = new ObjectId(ws._id);
	
	const {
		messagesCollection,
		roomsCollection,
		usersCollection,
	} = await getCollections();
	
	const user = await usersCollection.findOne({
		_id: userObjectId
	});
	
	if (!user) return null;
	
	const conversationalist = await usersCollection.findOne({
		_id: new ObjectId(payload.data.conversationalistId)
	});
	
	if (!conversationalist) return null;
	
	const room = await roomsCollection.findOne({
		$and: [
			{$or: [{firstUserId: userObjectId}, {secondUserId: userObjectId}]},
			{$or: [{firstUserId: new ObjectId(conversationalist._id)}, {secondUserId: new ObjectId(conversationalist._id)}]},
		],
	});
	
	if (!room) return null;
	
	const {insertedId} = await messagesCollection.insertOne({
		roomId: new ObjectId(room._id),
		text: payload.data.text,
		userId: userObjectId,
	});
	
	const message = await messagesCollection.findOne({_id: new ObjectId(insertedId)});
	
	if (!message) return null;
	
	message.author = user.name ?? '';

	return message;
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
					messages: await getMessage(ws),
				},
			});
		
		case 'NEW_MESSAGE':
			return JSON.stringify({
				type,
				data: {
					message: await newMessage(ws, payload),
				},
			});
	}
	
	return JSON.stringify({
		type: 'type',
		data: [],
	});
};

export default messageService;