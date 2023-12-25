const sendMessages = (wss, {room, userId, data}) => {
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

const handlePostRequest = async (collections, wss, {roomName, userId, users, data}) => {
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

module.exports = handlePostRequest;