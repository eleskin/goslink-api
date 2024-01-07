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
			case 'EDIT_MESSAGE':
				return await this.editMessage();
			case 'DELETE_MESSAGE':
				return await this.deleteMessage();
			case 'READ_MESSAGE':
				return await this.readMessage();
			case 'READ_ALL_MESSAGE':
				return await this.readAllMessage();
			case 'SEARCH_MESSAGE':
				return await this.searchMessage();
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
			dateObject: new Date().toUTCString(),
			checked: false,
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
	
	private static async editMessage() {
		const messagesCollection = await this.getCollection('messages');
		
		await messagesCollection.updateOne(
			{_id: new ObjectId(this.payload?.data._id)},
			{$set: {text: this.payload?.data.text}},
		);
		
		const message = await messagesCollection.findOne({_id: new ObjectId(this.payload?.data._id)});
		
		return {
			message,
		};
	}
	
	private static async deleteMessage() {
		const _id = this.payload?.data._id ?? '';
		const userId = this.payload?.data.userId ?? '';
		const contactId = this.payload?.data.contactId ?? '';
		
		const roomIds = [userId, contactId];
		roomIds.sort();
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
			userId,
			contactId,
		};
	}
	
	private static async readMessage() {
		const _id = this.payload?.data._id ?? '';
		
		const messagesCollection = await this.getCollection('messages');
		
		await messagesCollection.updateOne({_id: new ObjectId(_id)}, {$set: {checked: true}});
		
		return {_id};
	}
	
	private static async readAllMessage() {
		const userId = this.payload?.data.userId ?? '';
		const contactId = this.payload?.data.contactId ?? '';
		
		const messagesCollection = await this.getCollection('messages');
		
		await messagesCollection.updateMany({
			$and: [
				{contactId: new ObjectId(contactId)},
				{userId: new ObjectId(userId)},
			],
		}, {$set: {checked: true}});
		
		return {
			contactId,
			userId,
		};
	}
	
	private static async searchMessage() {
		const userId = this.payload?.data.userId ?? '';
		const searchValue = this.payload?.data.searchValue ?? '';
		
		const messagesCollection = await this.getCollection('messages');
		
		const searchedMessages = await messagesCollection.find({
			$and: [
				{$or: [{userId: new ObjectId(userId)}, {contactId: new ObjectId(userId)}]},
				{text: {$regex : searchValue}},
			]
		}).toArray();
		
		return {
			searchedMessages,
		}
	}
}

export default MessageService;