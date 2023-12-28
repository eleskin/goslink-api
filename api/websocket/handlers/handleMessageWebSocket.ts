import createNewUserResponse from '../services/createNewUserResponse';
import createNewMessageResponse from '../services/createNewMessageResponse';
import createDeleteMessageResponse from '../services/createDeleteMessageResponse';
import WebSocket from 'ws';
import {MongoClient} from 'mongodb';

const handleMessageWebSocket = async (
	client: MongoClient,
	wss: WebSocket.Server,
	ws: WebSocket & { roomName: string },
	dataJSON: string,
) => {
	const data = JSON.parse(dataJSON);
	
	const users = [data.username, data.conversationalist];
	users.sort();
	
	const roomName = users.join('|');
	ws.roomName = roomName;
	
	const usersCollection = client.db('main').collection('users');
	const roomsCollection = client.db('main').collection('rooms');
	const messagesCollection = client.db('main').collection('messages');
	
	const userId = (await usersCollection.findOne({username: data.username}))?._id;
	
	if (!userId) return;
	
	if (data.type === 'NEW_USER') {
		await createNewUserResponse(
			{usersCollection},
			ws,
			wss,
			data,
		);
	} else if (data.type === 'NEW_MESSAGE') {
		await createNewMessageResponse({
			collections: {roomsCollection, usersCollection, messagesCollection},
			wss,
			roomName,
			userId,
			users,
			data,
		});
	} else if (data.type === 'DELETE_MESSAGE') {
		await createDeleteMessageResponse({
			collections: {messagesCollection},
			data,
		});
	}
	
	for (const client of Array.from(wss.clients)) {
		if ((client as any).roomName !== ws.roomName) continue;
		
		const _id = (await roomsCollection.findOne({roomName: ws.roomName}))?._id;
		
		if (!_id) continue;
		
		const firstUserId = (await roomsCollection.findOne({roomName: ws.roomName}))?.firstUserId;
		const secondUserId = (await roomsCollection.findOne({roomName: ws.roomName}))?.secondUserId;
		
		const messages = (await messagesCollection.find({roomId: _id}).toArray());
		const conversationalistName = (await usersCollection.findOne({_id: userId.toString() !== firstUserId.toString() ? firstUserId : secondUserId}))?.name;
		
		for (const message of messages) {
			message.author = (await usersCollection.findOne({_id: message.userId}))?.name;
		}
		
		client.send(JSON.stringify({
			type: 'NEW_MESSAGES',
			conversationalistName,
			messages,
		}));
	}
};

export default handleMessageWebSocket;