const createNewUserResponse = async (collections, ws, wss, data) => {
	const {usersCollection} = collections;
	
	const conversationalist = await usersCollection.findOne({username: data.conversationalist});
	
	for (const client of wss.clients) {
		if (client._id.toString() === conversationalist._id.toString()) {
			
			client.send(JSON.stringify({
				type: data.online ? 'SET_ONLINE' : 'SET_OFFLINE',
				data: {
					'conversationalist': data.username,
				},
			}));
		}
	}
	
	ws.send(JSON.stringify({
		type: data.type,
		conversationalistName: (await usersCollection.findOne({username: data.conversationalist})).name,
	}));
};

module.exports = createNewUserResponse;