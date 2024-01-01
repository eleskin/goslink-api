import {Payload} from '../types';
import WebSocketService from './WebSocketService';

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
		}
		
		return () => {
		};
	}
	
	private static async newMessage() {
		const messagesCollection = await this.getCollection('messages');
		
		const {insertedId} = await messagesCollection.insertOne(this.payload?.data ?? {});
		
		return {
			message: await messagesCollection.findOne({_id: insertedId}),
		} ?? null;
	}
}

export default MessageService;