import client from '../../../services/client';
import {Payload} from '../types';
import {ObjectId} from 'mongodb';

class UserService {
	private static payload: Payload | undefined;
	private static mongoDbClient = client.connect();
	
	public static async setPayload(payload: Payload) {
		this.payload = payload;
		
		return await this.getData();
	}
	
	private static async getCollection(collection: string) {
		return (await this.mongoDbClient).db('main').collection(collection);
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
		const contactId = this.payload?.data.contactId ?? '';
		
		const usersCollection = await this.getCollection('users');
		
		return {
			user: await usersCollection.findOne({_id: new ObjectId(contactId)}),
		} ?? null;
	}
}

export default UserService;