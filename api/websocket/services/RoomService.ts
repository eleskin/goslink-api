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
		
		console.log(new ObjectId(userId));
		console.log(await messagesCollection.find({
			$or: [
				{userId: new ObjectId(userId)},
				{contactId: new ObjectId(userId)}
			]
		}).toArray());
		// const usersCollection = await this.getCollection('users');
		//
		// const {insertedId} = await messagesCollection.insertOne(this.payload?.data ?? {});
		// const authorName = (await usersCollection.findOne({_id: new ObjectId(this.payload?.data.userId)}))?.name;
		//
		// return {
		// 	message: {
		// 		...(await messagesCollection.findOne({_id: insertedId})),
		// 		author: authorName,
		// 	},
		// } ?? null;
	}
}

export default RoomService;