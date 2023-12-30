import {Collection, ObjectId} from 'mongodb';
import WebSocket from 'ws';

interface NewMessageResponse {
	collections: { [key: string]: Collection };
	wss: WebSocket.Server;
	roomName: string;
	userId: ObjectId;
	users: string[];
	data: any;
}

export default NewMessageResponse;