const getMessages = async (username, conversationalist, messagesCollection) => {
	const insideMessages = await messagesCollection.find({
		username: conversationalist,
		conversationalist: username,
	}).toArray();
	const outsideMessages = await messagesCollection.find({
		username: username,
		conversationalist,
	}).toArray();
	
	
	return [...insideMessages, ...outsideMessages]
}

module.exports = getMessages;