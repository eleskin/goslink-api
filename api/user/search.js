const express = require('express');
const client = require('../../services/client');

const router = express.Router();

router.post('', async (req, res) => {
	const {username} = req.body;
	
	const usersCollection = await client.db('main').collection('users');
	const users = await usersCollection.find({username}).toArray();
	
	res.send({
		name: users?.[0]?.name,
		username: users?.[0]?.username,
	});
});

module.exports = router;