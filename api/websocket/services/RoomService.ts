import WebSocketService from './WebSocketService';
import {Payload} from '../types';
import {ObjectId} from 'mongodb';
import OnlineUsers from '../utils/onlineUsers';
import UserService from './UserService';

class RoomService extends WebSocketService {
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
				return await this.getRoom();
		}
		
		return () => {
		};
	}
	
	private static async getRoom() {
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
		
		// const chatsId = [...new Set((await usersInChatsCollection.find({userId: new ObjectId(userId)}).toArray())
		// 	.map((item) => item.chatId))];
		// const messages = await messagesCollection.find({
		// 	chatId: {$in: chatsId},
		// }).toArray();
		//
		
		//
		
		
		// const usersId = new Set(messages.map((message) => message.userId.toString()));
		// const contactsId = new Set(messages.map((message) => message.contactId.toString()));
		//
		// const allId = [...new Set([...usersId, ...contactsId])].filter((id) => id !== userId);
		//
		// const rooms = [];
		//
		// for (const _id of allId) {
		// 	const room = await usersCollection.findOne({_id: new ObjectId(_id)});
		//
		// 	if (room) {
		// 		const key1 = `${userId}_${_id}`;
		// 		const key2 = `${_id}_${userId}`;
		//
		// 		const lastMessage = sortedMessages[key1] || sortedMessages[key2] || null;
		//
		// 		rooms.push({...room, lastMessage});
		// 	}
		// }
		// const rooms: any[] = [];
		//
		// for (const message of sortedMessages) {
		// 	const room: any = {
		// 		_id: '',
		// 		name: '',
		// 		lastMessage: {},
		// 	};
		//
		// 	const userRooms = (await usersInChatsCollection.find({chatId: message.chatId}).toArray())
		// 		.filter((item) => item.userId.toString() !== userId)
		// 		.map((item) => item.userId);
		// 	const users = await usersCollection.find({_id: {$in: userRooms}}).toArray();
		// 	const name = users.map((user) => user.name).join(', ');
		//
		// 	room._id = message.chatId;
		// 	room.name = name;
		// 	room.lastMessage = message;
		//
		// 	rooms.push(room);
		// }
		//
		
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

export default RoomService;