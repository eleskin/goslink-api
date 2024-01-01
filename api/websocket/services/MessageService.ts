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
		
		// const {insertedId} = await messagesCollection.insertOne(this.payload?.data ?? {});
		const {insertedId} = await messagesCollection.insertOne({
			userId: new ObjectId(this.payload?.data.userId),
			contactId: new ObjectId(this.payload?.data.contactId),
			text: this.payload?.data.text,
		});
		const authorName = (await usersCollection.findOne({_id: new ObjectId(this.payload?.data.userId)}))?.name;
		
		return {
			message: {
				...(await messagesCollection.findOne({_id: insertedId})),
				author: authorName,
			},
		} ?? null;
	}
	
	private static async deleteMessage() {
		const _id = this.payload?.data._id ?? '';
		
		const messagesCollection = await this.getCollection('messages');
		
		await messagesCollection.deleteOne({_id: new ObjectId(_id)});
		
		return {
			messageId: _id,
		};
	}
}

export default MessageService;