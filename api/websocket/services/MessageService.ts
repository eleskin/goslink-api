import {Payload} from '../types';
import WebSocketService from './WebSocketService';
import {ObjectId} from 'mongodb';

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
			case 'EDIT_MESSAGE':
				return await this.editMessage();
			case 'DELETE_MESSAGE':
				return await this.deleteMessage();
			case 'READ_MESSAGE':
				return await this.readMessage();
			case 'READ_ALL_MESSAGE':
				return await this.readAllMessage();
			case 'SEARCH_MESSAGE':
				return await this.searchMessage();
		}
		
		return () => {
		};
	}
	
	private static async newMessage() {
		const {userId, chatId, text} = this.payload?.data as any;
		
		const messagesCollection = await this.getCollection('messages');
		const usersCollection = await this.getCollection('users');
		
		const {insertedId} = await messagesCollection.insertOne({
			dateObject: new Date().toUTCString(),
			checked: false,
			chatId: new ObjectId(chatId),
			userId: new ObjectId(userId),
			text,
		});
		const message: any = await messagesCollection.findOne({_id: insertedId});
		message.author = await usersCollection.findOne({_id: new ObjectId(userId)})

		// const userRooms = (await usersInChatsCollection.find({chatId: message?.chatId}).toArray())
		// 	.filter((item) => item.userId.toString() !== userId)
		// 	.map((item) => item.userId);
		// const users = await usersCollection.find({_id: {$in: userRooms}}).toArray();
		// const chatName = users.map((user) => user.name).join(', ');
		//
		// const getChatName = async (user: boolean) => {
		// 	const userRooms = (await usersInChatsCollection.find({chatId: message?.chatId}).toArray())
		// 		.filter((item) => (user ? item.userId.toString() !== userId : item.userId.toString() === userId))
		// 		.map((item) => item.userId);
		// 	const users = await usersCollection.find({_id: {$in: userRooms}}).toArray();
		// 	return users.map((user) => user.name).join(', ');
		// }
		//
		return {
			message,
		// 	userChatName: await getChatName(true),
		// 	contactChatName: await getChatName(false),
		} ?? null;
	}
	
	private static async editMessage() {
		const messagesCollection = await this.getCollection('messages');
		
		await messagesCollection.updateOne(
			{_id: new ObjectId(this.payload?.data._id)},
			{$set: {text: this.payload?.data.text}},
		);
		
		const message = await messagesCollection.findOne({_id: new ObjectId(this.payload?.data._id)});
		
		return {
			message,
		};
	}
	
	private static async deleteMessage() {
		const _id = this.payload?.data._id ?? '';
		
		const messagesCollection = await this.getCollection('messages');
		
		const deletedMessage = await messagesCollection.findOne({_id: new ObjectId(_id)});
		
		await messagesCollection.deleteOne({_id: new ObjectId(_id)});
		
		return {
			deletedMessage,
		};
	}
	
	private static async readMessage() {
		const _id = this.payload?.data._id ?? '';
		
		const messagesCollection = await this.getCollection('messages');
		
		await messagesCollection.updateOne({_id: new ObjectId(_id)}, {$set: {checked: true}});
		
		return {_id};
	}
	
	private static async readAllMessage() {
		const _id = this.payload?.data._id ?? '';
		
		const messagesCollection = await this.getCollection('messages');
		const chatId = (await messagesCollection.findOne({_id: new ObjectId(_id)}))?.chatId;

		await messagesCollection.updateMany({
			chatId,
		}, {$set: {checked: true}});
		await messagesCollection.updateOne({_id: new ObjectId(_id)}, {$set: {checked: true}});

		return {_id};
	}
	
	private static async searchMessage() {
		const userId = this.payload?.data.userId ?? '';
		const searchValue = this.payload?.data.searchValue ?? '';
		
		const chatsCollection = await this.getCollection('chats');
		const usersCollection = await this.getCollection('users');
		const messagesCollection = await this.getCollection('messages');
		
		const chatsId = (await chatsCollection.find({users: new ObjectId(userId)}).toArray())
			.map((chat) => chat._id);
		
		const searchedMessages = await messagesCollection.find({
			$and: [
				{chatId: {$in: chatsId}},
				{text: {$regex: searchValue}},
			]
		}).toArray();

		const users = [];

		for (const message of searchedMessages) {
			const user = await usersCollection.findOne({_id: new ObjectId(message.userId)});

			if (user) {
				user.lastMessage = message;
			}

			users.push(user);
		}

		return {
			searchedMessages: users,
		}
	}
}

export default MessageService;