const handleGetRequest = async (collections, ws, data) => {
	const {usersCollection} = collections;
	
	ws.send(JSON.stringify({
		method: data.method,
		conversationalistName: (await usersCollection.findOne({username: data.conversationalist})).name,
	}));
};

module.exports = handleGetRequest;