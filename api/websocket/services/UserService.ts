import client from '../../../services/client';
import {Payload} from '../types';

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
}

export default UserService;