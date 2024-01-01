import client from '../../../services/client';
import {Payload} from '../types';
import {ObjectId} from 'mongodb';
import WebSocketService from './WebSocketService';

class UserService extends WebSocketService {
	private static payload: Payload | undefined;
	
	public static async setPayload(payload: Payload) {
		this.payload = payload;
		
		return await this.getData();
	}
	
	private static async getData() {
		if (!this.payload) return () => {
		};
		
		switch (this.payload?.type) {
			case 'SEARCH_USER':
				return await this.searchUser();
			
			case 'GET_USER':
				return await this.getUser();
		}
		
		return () => {
		};
	}
	
	private static async searchUser() {
		const contactUsername = this.payload?.data.contactUsername ?? '';
		
		const usersCollection = await this.getCollection('users');
		
		return {
			user: await usersCollection.findOne({username: contactUsername}),
		} ?? null;
	}
	
	private static async getUser() {
		const userId = this.payload?.data.userId ?? '';
		const contactId = this.payload?.data.contactId ?? '';
		
		const usersCollection = await this.getCollection('users');
		const messagesCollection = await this.getCollection('messages');
		
		const messages = await messagesCollection.find({
			$or: [
				{$and: [{contactId: new ObjectId(contactId), userId: new ObjectId(userId)}]},
				{$and: [{contactId: new ObjectId(userId), userId: new ObjectId(contactId)}]},
			],
		}).toArray();
		
		const userName = (await usersCollection.findOne({_id: new ObjectId(userId)}))?.name;
		const contactName = (await usersCollection.findOne({_id: new ObjectId(contactId)}))?.name;
		
		for (const message of messages) {
			if (message.userId.toString() === userId) {
				message.author = userName;
			} else if (message.userId.toString() === contactId) {
				message.author = contactName;
			}
		}
		
		return {
			user: await usersCollection.findOne({_id: new ObjectId(contactId)}),
			messages,
		} ?? null;
	}
}

export default UserService;