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
			case 'GET_ROOM':
				return await this.getRoom();
		}
		
		return () => {
		};
	}
	
	private static async getRoom() {
		const userId = this.payload?.data.userId;
		
		const messagesCollection = await this.getCollection('messages');
		const usersInChatsCollection = await UserService.getCollection('users_in_chats');
		const usersCollection = await UserService.getCollection('users');
		
		const chatsId = [...new Set((await usersInChatsCollection.find({userId: new ObjectId(userId)}).toArray())
			.map((item) => item.chatId))];
		const messages = await messagesCollection.find({
			chatId: {$in: chatsId}
		}).toArray();
		
		const sortedMessages: any[] = Object.values(messages.reduce((acc: any, message) => {
			acc[message.chatId.toString()] = message;

			return acc;
		}, {}));
		
		sortedMessages.sort((room1: any, room2: any) => {
			const date1 = new Date(room1.dateObject);
			const date2 = new Date(room2.dateObject);
			
			if (date1 > date2) return -1;
			if (date1 < date2) return 1;
			return 0;
		});

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
		const rooms: any[] = [];
		
		for (const message of sortedMessages) {
			const room: any = {
				_id: '',
				name: '',
				lastMessage: {}
			};
			
			room._id = message.chatId;
			room.name = (await usersCollection.findOne({_id: new ObjectId(message.userId)}))?.name;
			room.lastMessage = message;
			
			rooms.push(room);
		}

		return {
			rooms,
			// onlineRooms: Array.from(OnlineUsers.getUsers(userId))
		} ?? null;
	}
}

export default RoomService;