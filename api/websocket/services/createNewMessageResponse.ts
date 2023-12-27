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

const createNewMessageResponse = async (collections: any, wss: any, {roomName, userId, users, data}: any) => {
	const {roomsCollection, usersCollection, messagesCollection} = collections;
	
	const room = await roomsCollection.findOne({roomName});
	
	if (room) {
		await messagesCollection.insertOne({
			roomId: room._id,
			text: data.message,
			userId,
		});
		
		sendMessages(wss, {room, userId, data});
	} else {
		const [firstUserId, secondUserId] = [
			(await usersCollection.findOne({username: users[0]}))._id,
			(await usersCollection.findOne({username: users[1]}))._id,
		];
		
		const {insertedId} = await roomsCollection.insertOne({
			firstUserId,
			secondUserId,
			roomName,
		});
		
		await messagesCollection.insertOne({
			roomId: insertedId,
			text: data.message,
			userId,
		});
		
		const room = await roomsCollection.findOne({_id: insertedId});
		
		sendMessages(wss, {room, userId, data});
	}
};

export default createNewMessageResponse;