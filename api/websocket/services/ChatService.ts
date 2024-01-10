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
		const usersInChats = await this.getCollection('users_in_chats');
		const usersCollection = await this.getCollection('users');
		
		if (contactId) {
			const userChats = await usersInChats.find({userId: new ObjectId(userId)}).toArray();
			const contactChats = await usersInChats.find({userId: new ObjectId(contactId)}).toArray();
			
			const intersection = userChats.filter((item1) =>
				contactChats.some((item2) => item1.chatId.toString() === item2.chatId.toString()),
			);
			
			const contact = await usersCollection.findOne({_id: new ObjectId(contactId)});
			
			if (intersection?.[0]?.chatId) {
				return {
					chatId: intersection[0].chatId,
					contact,
				};
			} else {
				const {insertedId} = await chatsCollection.insertOne({});
				
				await usersInChats.insertOne({userId: new ObjectId(userId), chatId: insertedId});
				await usersInChats.insertOne({userId: new ObjectId(contactId), chatId: insertedId});
				
				return {
					chatId: insertedId,
					contact,
				};
			}
		} else {
		}
	}
	
	private static async getChat() {
		const chatId = this.payload?.data.chatId ?? '';
		
		const usersCollection = await this.getCollection('users');
		const usersInChats = await this.getCollection('users_in_chats');
		
		const usersId = (await usersInChats.find({chatId: new ObjectId(chatId)}).toArray())
			.map((chat) => new ObjectId(chat.userId));
		
		const users = await usersCollection.find({_id: {$in: usersId}}).toArray();
		
		return {
			users,
		};
	}
}

export default ChatService;