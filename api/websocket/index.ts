import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import webSocketHandleConnection from './handlers/webSocketHandleConnection';
import webSocketHandleClose from './handlers/webSocketHandleClose';

const app = express();

const server = http.createServer(app).listen(8000);
const wss = new WebSocket.Server({server});

wss.on('connection', webSocketHandleConnection);
wss.on('close', webSocketHandleClose);

export default app;