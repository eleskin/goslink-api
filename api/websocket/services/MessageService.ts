import {Payload} from '../types';
import WebSocketService from './WebSocketService';
import {ObjectId} from 'mongodb';

class MessageService extends WebSocketService {
	private static payload: Payload | undefined;
	
	public static async setPayload(payload: Payload) {
		this.payload = payload;
		
		return await this.getData();
	}
	
	private static async getData() {
		if (!this.payload) return () => {
		};
		
		switch (this.payload?.type) {
			case 'NEW_MESSAGE':
				return await this.newMessage();
			case 'DELETE_MESSAGE':
				return await this.deleteMessage();
		}
		
		return () => {
		};
	}
	
	private static async newMessage() {
		const messagesCollection = await this.getCollection('messages');
		const usersCollection = await this.getCollection('users');
		
		const {insertedId} = await messagesCollection.insertOne({
			userId: new ObjectId(this.payload?.data.userId),
			contactId: new ObjectId(this.payload?.data.contactId),
			text: this.payload?.data.text,
		});
		const author = await usersCollection.findOne({_id: new ObjectId(this.payload?.data.userId)});
		const contact = await usersCollection.findOne({_id: new ObjectId(this.payload?.data.contactId)});
		
		return {
			message: {
				...(await messagesCollection.findOne({_id: insertedId})),
				author,
				contact,
			},
		} ?? null;
	}
	
	private static async deleteMessage() {
		const _id = this.payload?.data._id ?? '';
		const userId = this.payload?.data.userId ?? '';
		const contactId = this.payload?.data.contactId ?? '';
		
		const roomIds = [userId, contactId];
		roomIds.sort()
		const roomKey = `${roomIds[0]}_${roomIds[1]}`;
		
		const messagesCollection = await this.getCollection('messages');
		
		await messagesCollection.deleteOne({_id: new ObjectId(_id)});
		
		const messages = await messagesCollection.find().toArray();
		
		const sortedMessages = messages.reduce((acc: any, message) => {
			const ids = [message.userId, message.contactId];
			ids.sort();
			const key = `${ids[0]}_${ids[1]}`;
			
			acc[key] = message;
			
			return acc;
		}, {});
		
		return {
			removedMessageId: _id,
			lastMessage: sortedMessages[roomKey],
			roomId: userId,
		};
	}
}

export default MessageService;