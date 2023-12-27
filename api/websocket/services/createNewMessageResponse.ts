import NewMessageResponse from '../interfaces/NewMessageResponse';

const sendMessages = (wss: any, {room, userId, data}: any) => {
	for (const client of wss.clients) {
		if (client._id.toString() === (room.firstUserId === userId ? room.secondUserId : room.firstUserId).toString()) {
			client.send(JSON.stringify({
				type: 'NEW_MESSAGE',
				data: {
					conversationalistUsername: data.conversationalist,
				},
			}));
		}
		if (client._id.toString() === (room.firstUserId !== userId ? room.secondUserId : room.firstUserId).toString()) {
			client.send(JSON.stringify({
				type: 'NEW_MESSAGE',
				data: {
					conversationalistUsername: data.username,
				},
			}));
		}
	}
};

const createNewMessageResponse = async (payload: NewMessageResponse) => {
	const {
		roomsCollection,
		usersCollection,
		messagesCollection,
	} = payload.collections;
	
	const room = await roomsCollection.findOne({roomName: payload.roomName});
	
	if (room) {
		await messagesCollection.insertOne({
			roomId: room._id,
			text: payload.data.message,
			userId: payload.userId,
		});
		
		sendMessages(payload.wss, {room, userId: payload.userId, data: payload.data});
	} else {
		const [firstUserId, secondUserId] = [
			(await usersCollection.findOne({username: payload.users[0]}))?._id,
			(await usersCollection.findOne({username: payload.users[1]}))?._id,
		];
		
		const {insertedId} = await roomsCollection.insertOne({
			firstUserId,
			secondUserId,
			roomName: payload.roomName,
		});
		
		await messagesCollection.insertOne({
			roomId: insertedId,
			text: payload.data.message,
			userId: payload.userId,
		});
		
		const room = await roomsCollection.findOne({_id: insertedId});
		
		sendMessages(payload.wss, {room, userId: payload.userId, data: payload.data});
	}
};

export default createNewMessageResponse;