import {ObjectId} from 'mongodb';
import OnlineUsers from '../utils/onlineUsers';
import getCollection from '../../../services/functions/getCollection';
import Payload from '../../../types/Payload';
import Message from '../../../types/Message';
import Chat from '../../../types/Chat';
import User from '../../../types/User';

class ChatService {
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
			case 'NEW_GROUP_CHAT':
				return await this.newGroupChat();
			case 'GET_CHAT':
				return await this.getChat();
			case 'DELETE_CHAT':
				return await this.deleteChat();
			case 'ADD_USER_CHAT':
				return await this.addUserChat();
		}
		
		return () => {
		};
	}
	
	private static async newChat() {
		const userId = this.payload?.data.userId ?? '';
		const contactId = this.payload?.data.contactId ?? '';
		
		const chatsCollection = await getCollection('chats');
		const usersCollection = await getCollection('users');
		
		if (contactId) {
			const user = await usersCollection.findOne<User>({_id: new ObjectId(userId)});
			const contact = await usersCollection.findOne<User>({_id: new ObjectId(contactId)});
			
			let chat = await chatsCollection.findOne<Chat>({
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
					group: false,
					name: `${user?.name}|${contact?.name}`,
				});
				
				chat = await chatsCollection.findOne<Chat>({_id: insertedId});
			}
			
			return {
				chat,
				contact,
			};
		} else {
		}
	}
	
	private static async newGroupChat() {
		const userId = this.payload?.data.userId ?? '';
		
		const chatsCollection = await getCollection('chats');
		
		const {insertedId} = await chatsCollection.insertOne({
			users: [new ObjectId(userId)],
			group: true,
		});
		
		const chat = await chatsCollection.findOne({_id: insertedId});
		
		return {
			chat,
		};
	}
	
	private static async getChat() {
		const userId = this.payload?.data.userId;
		
		const messagesCollection = await getCollection('messages');
		const usersCollection = await getCollection('users');
		const chatsCollection = await getCollection('chats');
		
		const chats = await chatsCollection.find<Chat>({
			users: {
				$all: [new ObjectId(userId)],
			},
		}).toArray();
		
		for (const chat of chats) {
			const usersId = chat.users.filter((id) => id.toString() !== userId);
			const names = (await usersCollection.find({_id: {$in: usersId}}).toArray())
				.map((user) => user.name);
			const name = chat.group ? 'Group chat' : names[0];
			
			const messages = await messagesCollection.find<Message>({
				chatId: chat._id,
			}).toArray();
			
			const sortedMessages: Message[] = Object.values(messages.reduce((acc: { [key: string]: Message }, message) => {
				acc[message.chatId.toString()] = message;
				
				return acc;
			}, {}));
			
			chat.name = name || 'Group chat';
			chat.lastMessage = sortedMessages[0];
		}
		
		chats.sort((chat1, chat2) => {
			const date1 = new Date(chat1.lastMessage?.dateObject);
			const date2 = new Date(chat2.lastMessage?.dateObject);
			
			if (date1 > date2) return -1;
			if (date1 < date2) return 1;
			return 0;
		});
		
		return {
			chats,
			onlineChats: Array.from(OnlineUsers.getUsers(userId)),
		} ?? null;
	}
	
	private static async deleteChat() {
		const userId = this.payload?.data.userId ?? '';
		const chatId = this.payload?.data.chatId ?? '';
		
		const chatsCollection = await getCollection('chats');
		
		const chat = await chatsCollection.findOne<Chat>({_id: new ObjectId(chatId)});
		
		if (chat?.group) {
			if (chat.users.length > 1) {
				await chatsCollection.updateOne({
					_id: new ObjectId(chatId),
				}, {
					$set: {
						users: chat.users.filter((_id: ObjectId) => _id.toString() !== userId),
					},
				});
			} else {
				await chatsCollection.deleteOne({_id: new ObjectId(chatId)});
			}
		} else {
			await chatsCollection.deleteOne({_id: new ObjectId(chatId)});
		}
		
		return {
			chat,
		};
	}
	
	private static async addUserChat() {
		const chatId = this.payload?.data.chatId ?? '';
		const contactId = this.payload?.data.contactId ?? '';
		
		const chatsCollection = await getCollection('chats');
		
		const chat = await chatsCollection.findOne({_id: new ObjectId(chatId)});
		
		await chatsCollection.updateOne({_id: chat?._id}, {
			$set: {
				users: [...chat?.users, new ObjectId(contactId)],
			},
		});
		
		return {
			chat,
		};
	}
}

export default ChatService;