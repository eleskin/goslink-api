import createNewUserResponse from '../services/createNewUserResponse';
import createNewMessageResponse from '../services/createNewMessageResponse';
import createDeleteMessageResponse from '../services/createDeleteMessageResponse';
import WebSocket from 'ws';
import {MongoClient} from 'mongodb';
import createNewMessagesResponse from '../services/createNewMessagesResponse';

const handleMessageWebSocket = async (
	client: MongoClient,
	wss: WebSocket.Server,
	ws: WebSocket & { _id: string; roomName: string },
	dataJSON: string,
) => {
	const data = JSON.parse(dataJSON);
	
	const users = [data.username, data.conversationalist];
	users.sort();
	
	const roomName = data.username && data.conversationalist ? users.join('|') : '';
	
	if (roomName) ws.roomName = roomName;
	
	const usersCollection = client.db('main').collection('users');
	const roomsCollection = client.db('main').collection('rooms');
	const messagesCollection = client.db('main').collection('messages');
	
	const userId = (await usersCollection.findOne({username: data.username}))?._id;
	
	if (!userId) return;
	
	switch (data.type) {
		case 'NEW_USER':
			await createNewUserResponse(
				{usersCollection},
				ws,
				wss,
				data,
			);
			break;
		
		case 'NEW_MESSAGE':
			await createNewMessageResponse({
				collections: {roomsCollection, usersCollection, messagesCollection},
				wss,
				roomName,
				userId,
				users,
				data,
			});
			break;
		
		case 'DELETE_MESSAGE':
			await createDeleteMessageResponse({
				collections: {messagesCollection},
				data,
			});
			break;
		
		default:
			break;
	}
	
	await createNewMessagesResponse(
		wss,
		ws,
		{usersCollection, roomsCollection, messagesCollection},
		userId,
	);
};

export default handleMessageWebSocket;