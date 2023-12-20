const express = require('express');
const client = require('../../services/client');
const http = require('http');
const WebSocket = require('ws');

const router = express.Router();
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({server});
const users = new Set();

wss.on('connection', async (ws) => {
	await client.connect();
	await ws.send(JSON.stringify(await client.db('main').collection('messages').find().toArray()));
	users.add(ws);

	ws.on('message', async (data) => {
		console.log(JSON.parse(data));
		await ws.send(JSON.stringify(JSON.parse(data)));
		const _data = JSON.parse(data);
		await client.db('main').collection('messages').insertOne(_data);

		for(let user of users) {
			user.send(JSON.stringify(await client.db('main').collection('messages').find().toArray()));
		}
	});
});

server.listen(8000);

module.exports = router;