import {Collection, ObjectId} from 'mongodb';
import WebSocket from 'ws';

interface CreateNewMessageResponse {
	collections: { [key: string]: Collection };
	wss: WebSocket.Server;
	roomName: string;
	userId: ObjectId;
	users: string[];
	data: any;
}

export default CreateNewMessageResponse;