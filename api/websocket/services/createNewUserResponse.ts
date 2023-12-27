const createNewUserResponse = async (collections: any, ws: any, wss: any, data: any) => {
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

export default createNewUserResponse;