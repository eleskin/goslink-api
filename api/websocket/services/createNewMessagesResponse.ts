import WebSocket from 'ws';
import {Collection, ObjectId} from 'mongodb';

const createNewMessageResponse = async (
	wss: WebSocket.Server,
	ws: WebSocket & { _id: string; roomName: string },
	collections: { [key: string]: Collection },
	userId: ObjectId,
) => {
	const {
		roomsCollection,
		usersCollection,
		messagesCollection,
	} = collections;
	
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

export default createNewMessageResponse;