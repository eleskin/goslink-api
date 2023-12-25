const sendResponse = require('./sendResponse');
const handlePostRequest = async (collections, wss, {roomName, userId, users, data}) => {
	const {roomsCollection, usersCollection, messagesCollection} = collections;
	
	const room = await roomsCollection.findOne({roomName});
	
	if (room) {
		await messagesCollection.insertOne({
			roomId: room._id,
			text: data.message,
			userId,
		});
		
		sendResponse('NEW_MESSAGE', wss, {room, userId, data});
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
		
		sendResponse('NEW_MESSAGE', wss, {room, userId, data});
	}
};

module.exports = handlePostRequest;