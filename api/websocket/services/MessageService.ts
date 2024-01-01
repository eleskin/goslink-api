import {Payload} from '../types';
import client from '../../../services/client';

class MessageService {
	private static payload: Payload | undefined;
	private static mongoDbClient = client.connect();
	
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
	
	}
}

export default MessageService;