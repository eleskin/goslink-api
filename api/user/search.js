const express = require('express');
const {MongoClient, ServerApiVersion} = require('mongodb');

const router = express.Router();

const client = new MongoClient(process.env.MONGODB_URL, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

router.post('', async (req, res) => {
	const {username} = req.body;
	
	const usersCollection = await client.db('main').collection('users');
	const users = await usersCollection.find({username}).toArray();
	
	res.send({name: users?.[0]?.name});
});

module.exports = router;