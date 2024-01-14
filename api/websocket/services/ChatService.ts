import WebSocketService from './WebSocketService';
import {Payload} from '../types';
import {ObjectId} from 'mongodb';

class ChatService extends WebSocketService {
	private static payload: Payload | undefined;
	
	public static async setPayload(payload: Payload) {
		this.payload = payload;
		
		return await this.getData();
	}
	
	private static async getData() {
		if (!this.payload) return () => {
		};
		
		switch (this.payload?.type) {
			case 'NEW_CHAT':
				return await this.newChat();
		}
		
		return () => {
		};
	}
	
	private static async newChat() {
		const userId = this.payload?.data.userId ?? '';
		const contactId = this.payload?.data.contactId ?? '';
		
		const chatsCollection = await this.getCollection('chats');
		const usersCollection = await this.getCollection('users');
		
		if (contactId) {
			const contact = await usersCollection.findOne({_id: new ObjectId(contactId)});
			
			let chat = await chatsCollection.findOne({
				users: {
					$all: [
						new ObjectId(userId),
						new ObjectId(contactId),
					],
					$size: 2,
				},
			});
			
			if (!chat) {
				const {insertedId} = await chatsCollection.insertOne({
					users: [new ObjectId(userId), new ObjectId(contactId)],
				});
				
				chat = await chatsCollection.findOne({_id: insertedId});
			}
			
			return {
				chat,
				contact,
			};
		} else {
		}
	}
}

export default ChatService;