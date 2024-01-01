import {Payload} from '../types';
import WebSocketService from './WebSocketService';
import {ObjectId} from 'mongodb';

class MessageService extends WebSocketService {
	private static payload: Payload | undefined;
	
	public static async setPayload(payload: Payload) {
		this.payload = payload;
		
		return await this.getData();
	}
	
	private static async getData() {
		if (!this.payload) return () => {
		};
		
		switch (this.payload?.type) {
			case 'NEW_MESSAGE':
				return await this.newMessage();
		}
		
		return () => {
		};
	}
	
	private static async newMessage() {
		const messagesCollection = await this.getCollection('messages');
		const usersCollection = await this.getCollection('users');
		
		const {insertedId} = await messagesCollection.insertOne(this.payload?.data ?? {});
		const authorName = (await usersCollection.findOne({_id: new ObjectId(this.payload?.data.userId)}))?.name;
		
		return {
			message: {
				...(await messagesCollection.findOne({_id: insertedId})),
				author: authorName,
			},
		} ?? null;
	}
}

export default MessageService;