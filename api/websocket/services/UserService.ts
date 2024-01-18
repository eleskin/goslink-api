import {ObjectId} from 'mongodb';
import OnlineUsers from '../utils/onlineUsers';
import getCollection from '../../../services/functions/getCollection';
import Payload from '../../../types/Payload';

class UserService {
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
		
		const usersCollection = await getCollection('users');
		
		return {
			user: await usersCollection.findOne({username: contactUsername}),
		} ?? null;
	}
	
	private static async onlineUser() {
		const userId = this.payload?.data.userId;
		const chatId = this.payload?.data.chatId;
		
		const chatsCollection = await getCollection('chats');
		
		const users = (await chatsCollection.findOne({_id: new ObjectId(chatId)}))?.users || [];
		
		for (const user of users) {
			if (user.toString() !== userId) OnlineUsers.setUser(user.toString(), userId);
		}
		
		return {
			userId: userId ?? '',
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