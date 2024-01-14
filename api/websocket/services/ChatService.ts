import WebSocketService from './WebSocketService';
import {Payload} from '../types';
import {ObjectId} from 'mongodb';
import UserService from './UserService';
import OnlineUsers from '../utils/onlineUsers';

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
			case 'GET_CHAT':
				return await this.getChat();
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
		const userId = this.payload?.data.userId;
		
		const messagesCollection = await this.getCollection('messages');
		const usersCollection = await UserService.getCollection('users');
		const chatsCollection = await UserService.getCollection('chats');
		
		const chats = await chatsCollection.find({
			users: {
				$all: [new ObjectId(userId)],
			},
		}).toArray();
		
		const rooms = [];
		
		for (const chat of chats) {
			const usersId = chat.users.filter((id: string) => id.toString() !== userId);
			const name = (await usersCollection.find({_id: {$in: usersId}}).toArray())
				.map((user) => user.name)
				.join(', ');
			
			const messages = await messagesCollection.find({
				chatId: chat._id,
			}).toArray();
			
			const sortedMessages: any[] = Object.values(messages.reduce((acc: any, message) => {
				acc[message.chatId.toString()] = message;
				
				return acc;
			}, {}));
			
			rooms.push({
				_id: chat._id,
				name,
				lastMessage: sortedMessages[0],
			});
		}
		
		rooms.sort((room1: any, room2: any) => {
			const date1 = new Date(room1.lastMessage?.dateObject);
			const date2 = new Date(room2.lastMessage?.dateObject);
			
			if (date1 > date2) return -1;
			if (date1 < date2) return 1;
			return 0;
		});
		
		return {
			rooms,
			onlineRooms: Array.from(OnlineUsers.getUsers(userId))
		} ?? null;
	}
}

export default ChatService;