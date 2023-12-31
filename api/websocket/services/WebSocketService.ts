import client from '../../../services/client';

abstract class WebSocketService {
	private static mongoDbClient = client.connect();
	
	protected static async getCollection(collection: string) {
		return (await this.mongoDbClient).db('main').collection(collection);
	}
}

export default WebSocketService;