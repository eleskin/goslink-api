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
			let chat = await chatsCollection.findOne({
				users: {
					$all: [
						new ObjectId(userId),
						new ObjectId(contactId),
					],
					$size: 2,
				}
			});
			
			if (!chat) {
				const {insertedId} = await chatsCollection.insertOne({
					users: [new ObjectId(userId), new ObjectId(contactId)]
				});
				
				chat = await chatsCollection.findOne({_id: insertedId});
			}
			
			console.log(chat)
		// 	const userChats = await usersInChats.find({userId: new ObjectId(userId)}).toArray();
		// 	const contactChats = await usersInChats.find({userId: new ObjectId(contactId)}).toArray();
		//
		// 	const intersection = userChats.filter((item1) =>
		// 		contactChats.some((item2) => item1.chatId.toString() === item2.chatId.toString()),
		// 	);
		//
		// 	const contact = await usersCollection.findOne({_id: new ObjectId(contactId)});
		//
		// 	if (intersection?.[0]?.chatId) {
		// 		return {
		// 			chatId: intersection[0].chatId,
		// 			contact,
		// 		};
		// 	} else {
		// 		const {insertedId} = await chatsCollection.insertOne({});
		//
		// 		await usersInChats.insertOne({userId: new ObjectId(userId), chatId: insertedId});
		// 		await usersInChats.insertOne({userId: new ObjectId(contactId), chatId: insertedId});
		//
		// 		return {
		// 			chatId: insertedId,
		// 			contact,
		// 		};
		// 	}
		} else {
		}
	}
	
	private static async getChat() {
		const userId = this.payload?.data.userId ?? '';
		const chatId = this.payload?.data.chatId ?? '';
		
		const usersCollection = await this.getCollection('users');
		const messagesCollection = await this.getCollection('messages');
		const usersInChats = await this.getCollection('users_in_chats');
		
		const usersId = (await usersInChats.find({chatId: new ObjectId(chatId)}).toArray())
			.filter((chat) => chat.userId.toString() !== userId)
			.map((chat) => new ObjectId(chat.userId));
		
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