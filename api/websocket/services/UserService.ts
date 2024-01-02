import {Payload} from '../types';
import {ObjectId} from 'mongodb';
import WebSocketService from './WebSocketService';
import OnlineUsers from '../utils/onlineUsers';

class UserService extends WebSocketService {
	private static payload: Payload;
	
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
			
			case 'ONLINE_USER':
				return await this.onlineUser();
			
			case 'OFFLINE_USER':
				return await this.offlineUser();
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
		
		const user = await usersCollection.findOne({_id: new ObjectId(userId)});
		const contact = await usersCollection.findOne({_id: new ObjectId(contactId)});
		
		for (const message of messages) {
			if (message.userId.toString() === userId) {
				message.author = user;
			} else if (message.userId.toString() === contactId) {
				message.author = contact;
			}
		}
		
		return {
			user: await usersCollection.findOne({_id: new ObjectId(contactId)}),
			messages,
		} ?? null;
	}
	
	private static async onlineUser() {
		OnlineUsers.setUser(this.payload?.data.userId, this.payload?.data.contactId);
		
		return {
			userId: this.payload?.data.userId ?? '',
		} ?? null;
	}
	
	private static async offlineUser() {
		OnlineUsers.deleteUser(this.payload?.data.contactId);
		
		return {
			userId: this.payload?.data.userId ?? '',
		} ?? null;
	}
}

export default UserService;