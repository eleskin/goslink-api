import WebSocketService from './WebSocketService';
import {Payload} from '../types';

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
		
		const chatsCollection = await this.getCollection('chats');
		const usersInChats = await this.getCollection('users_in_chats');
		
		const {insertedId} = await chatsCollection.insertOne({});
		
		await usersInChats.insertOne({userId: userId, chatId: insertedId});
		
		return {
			chatId: insertedId,
		};
	}
}

export default ChatService;