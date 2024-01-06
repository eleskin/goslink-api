import WebSocketService from './WebSocketService';
import {Payload} from '../types';
import {ObjectId} from 'mongodb';
import OnlineUsers from '../utils/onlineUsers';

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
		const usersCollection = await this.getCollection('users');
		
		const messages = await messagesCollection.find({
			$or: [
				{userId: new ObjectId(userId)},
				{contactId: new ObjectId(userId)},
			],
		}).toArray();
		
		const sortedMessages = messages.reduce((acc: any, message) => {
			const ids = [message.userId, message.contactId].sort();
			const key = `${ids[0]}_${ids[1]}`;
			
			acc[key] = message;
			
			return acc;
		}, {});
		
		const usersId = new Set(messages.map((message) => message.userId.toString()));
		const contactsId = new Set(messages.map((message) => message.contactId.toString()));
		
		const allId = [...new Set([...usersId, ...contactsId])].filter((id) => id !== userId);
		
		const rooms = [];
		
		for (const _id of allId) {
			const room = await usersCollection.findOne({_id: new ObjectId(_id)});
			
			if (room) {
				const key1 = `${userId}_${_id}`;
				const key2 = `${_id}_${userId}`;
				
				const lastMessage = (sortedMessages[key1] || sortedMessages[key2] || null)?.text ?? '';
				const lastMessageDate = (sortedMessages[key1] || sortedMessages[key2] || null)?.dateObject ?? '';
				
				rooms.push({...room, lastMessage, lastMessageDate});
			}
		}
		
		rooms.sort((room1, room2) => {
			const date1 = new Date(room1.lastMessageDate);
			const date2 = new Date(room2.lastMessageDate);
			
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