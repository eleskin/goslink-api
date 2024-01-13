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
			case 'GET_CHAT':
				return await this.getChat();
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
	
	private static async getChat() {
		const userId = this.payload?.data.userId ?? '';
		const chatId = this.payload?.data.chatId ?? '';

		const usersCollection = await this.getCollection('users');
		const messagesCollection = await this.getCollection('messages');
		const chatsCollection = await this.getCollection('chats');
		
		const usersId = (await chatsCollection.findOne({_id: new ObjectId(chatId), users: new ObjectId(userId)}))?.users
			.filter((id: ObjectId) => id.toString() !== userId);
		
		if (!usersId) return {};
		
		const users = await usersCollection.find({_id: {$in: usersId}}).toArray();

		const messages = await messagesCollection.find({chatId: new ObjectId(chatId)}).toArray();

		for (const message of messages) {
			message.author = await usersCollection.findOne({_id: message.userId});
		}

		return {
			users,
			messages,
		};
	}
}

export default ChatService;