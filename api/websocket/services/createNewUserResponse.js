const createNewUserResponse = async (collections, ws, wss, data) => {
	const {usersCollection} = collections;
	
	const conversationalistId = (await usersCollection.findOne({username: data.conversationalist}))._id;
	
	for (const client of wss.clients) {
		if (client._id.toString() === conversationalistId.toString()) {
			client.send(JSON.stringify({'sda': 'dsafds'}));
		}
	}
	
	ws.send(JSON.stringify({
		type: data.type,
		conversationalistName: (await usersCollection.findOne({username: data.conversationalist})).name,
	}));
};

module.exports = createNewUserResponse;