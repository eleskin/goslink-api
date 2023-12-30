import authenticateJWT from '../../services/functions/authenticateJWT';
import client from '../../services/client';
import express from 'express';

const router = express.Router();

router.post('/rooms', authenticateJWT, async (req, res) => {
	const {username} = req.body;
	const [
		roomsCollection,
		usersCollection,
		messagesCollection,
	] = await Promise.all([
		client.db('main').collection('rooms'),
		client.db('main').collection('users'),
		client.db('main').collection('messages')],
	);
	const _id = (await usersCollection.findOne({username}))?._id;
	
	const rooms = await roomsCollection.find({
		$or: [{firstUserId: _id}, {secondUserId: _id}],
	}).toArray();
	
	for (const room of rooms) {
		const conversationalistId = room.firstUserId.toString() === _id?.toString() ? room.secondUserId : room.firstUserId;
		room.conversationalist = conversationalistId;
		room.conversationalistName = (await usersCollection.findOne({_id: conversationalistId}))?.name;
		const messages = messagesCollection.find({roomId: room._id}).sort({_id: -1}).limit(1);
		room.lastMessage = (await messages.toArray())[0]?.text;
	}
	
	return res.status(200).send({
		rooms,
	});
});

export default router;