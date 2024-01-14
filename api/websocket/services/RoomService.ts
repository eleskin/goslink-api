import WebSocketService from './WebSocketService';
import {Payload} from '../types';

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
		}
		
		return () => {
		};
	}
	
}

export default RoomService;