const createNewUserResponse = async (collections, ws, data) => {
	const {usersCollection} = collections;
	
	ws.send(JSON.stringify({
		type: data.type,
		conversationalistName: (await usersCollection.findOne({username: data.conversationalist})).name,
	}));
};

module.exports = createNewUserResponse;