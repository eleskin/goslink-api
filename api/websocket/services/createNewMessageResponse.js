const createNewMessageResponse = (type, wss, {room, userId, data}) => {
	for (const client of wss.clients) {
		if (client._id.toString() === (room.firstUserId === userId ? room.secondUserId : room.firstUserId).toString()) {
			client.send(JSON.stringify({
				type,
				data: {
					conversationalistUsername: data.conversationalist,
				},
			}));
		}
		if (client._id.toString() === (room.firstUserId !== userId ? room.secondUserId : room.firstUserId).toString()) {
			client.send(JSON.stringify({
				type,
				data: {
					conversationalistUsername: data.username,
				},
			}));
		}
	}
};

module.exports = createNewMessageResponse;