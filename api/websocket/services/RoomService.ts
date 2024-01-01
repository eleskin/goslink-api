import WebSocketService from './WebSocketService';
import {Payload} from '../types';
import {ObjectId} from 'mongodb';

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
		
		const usersId = new Set(messages.map((message) => message.userId.toString()));
		const contactsId = new Set(messages.map((message) => message.contactId.toString()));
		
		const allId = [...new Set([...usersId, ...contactsId])].filter((id) => id !== userId);
		
		const rooms = [];
		
		for (const _id of allId) {
			rooms.push(await usersCollection.findOne({_id: new ObjectId(_id)}));
		}
		
		return {
			rooms,
		} ?? null;
	}
}

export default RoomService;