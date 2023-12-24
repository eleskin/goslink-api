const authenticateJWT = require('../../services/functions/authenticateJWT');
const client = require('../../services/client');
const express = require('express');
const router = express.Router();

router.post('/rooms', authenticateJWT, async (req, res) => {
	const {username} = req.body;
	
	const roomsCollection = await client.db('main').collection('rooms');
	const usersCollection = await client.db('main').collection('users');
	const messagesCollection = await client.db('main').collection('messages');
	const {_id} = (await usersCollection.findOne({username}));
	
	const rooms = await roomsCollection.find({
		$or: [{firstUser: _id}, {secondUser: _id}],
	}).toArray();
	
	for (const room of rooms) {
		const conversationalistId = room.firstUser.toString() === _id.toString() ? room.secondUser : room.firstUser;
		room.conversationalist = (await usersCollection.findOne({_id: conversationalistId})).username;
		room.conversationalistName = (await usersCollection.findOne({_id: conversationalistId})).name;
		const messages = messagesCollection.find({roomId: room._id}).sort({_id: -1}).limit(1);
		room.lastMessage = (await messages.toArray())[0]?.text;
	}
	
	return res.status(200).send({
		rooms,
	});
});

module.exports = router;