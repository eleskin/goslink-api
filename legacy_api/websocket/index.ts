import WebSocket from 'ws';
import http from 'http';
import express from 'express';
import handleConnectionWebSocket from './handlers/handleConnectionWebSocket';
import handleMessageWebSocket from './handlers/handleMessageWebSocket';
import handleCloseWebSocket from './handlers/handleCloseWebSocket';
import getIdFromUrl from '../../services/functions/getIdFromUrl';
import client from '../../services/client';
import app from '../../api/websocket';


// const server = http.createServer(app).listen(8000);
// const wss = new WebSocket.Server({server});
//
// const connectedClients: Set<string> = new Set();
//
// wss.on(
// 	'connection',
// 	async (ws: WebSocket & { _id: string; roomName: string }, request,
// 	) => {
// 		console.log(getIdFromUrl(request))
// 		const _id = getIdFromUrl(request);
// 		ws._id = _id;
// 		console.log(_id);
// 		console.log(ws._id);
//
// 		await client.connect();
// 		console.log(ws);
// 		const messagesCollection = client.db('name').collection('messages');
// 		ws.send(JSON.stringify({type: 'GET_MESSAGES', data: {messages: messagesCollection.find({userId: _id}).toArray()}}))
// 		// await handleConnectionWebSocket(client, wss, ws, connectedClients);
//
// 		ws.on('message', (data: string) => handleMessageWebSocket(client, wss, ws, data));
//
// 		ws.on('close', () => handleCloseWebSocket(wss, connectedClients, _id));
//
// 	});

export default app;