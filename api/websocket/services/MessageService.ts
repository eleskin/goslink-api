import {ObjectId} from 'mongodb';
import getCollection from '../../../services/functions/getCollection';
import Payload from '../../../types/Payload';
import Message from '../../../types/Message';
import User from '../../../types/User';

class MessageService {
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
			case 'GET_MESSAGE':
				return await this.getMessage();
		}
		
		return () => {
		};
	}
	
	private static async newMessage() {
		const userId: string = this.payload?.data.userId;
		const chatId: string = this.payload?.data.chatId;
		const text: string = this.payload?.data.text;
		
		const messagesCollection = await getCollection('messages');
		const usersCollection = await getCollection('users');
		
		const {insertedId} = await messagesCollection.insertOne({
			dateObject: new Date().toUTCString(),
			checked: false,
			chatId: new ObjectId(chatId),
			userId: new ObjectId(userId),
			text,
		});
		
		const message = await messagesCollection.findOne<Message>({_id: insertedId});
		
		if (message) {
			message.author = (await usersCollection.findOne<User>({_id: new ObjectId(userId)})) as User;
		}
		
		return {
			message,
		} ?? null;
	}
	
	private static async editMessage() {
		const messagesCollection = await getCollection('messages');
		
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
		
		const messagesCollection = await getCollection('messages');
		const chatsCollection = await getCollection('chats');
		
		const deletedMessage = await messagesCollection.findOne({_id: new ObjectId(_id)});
		
		await messagesCollection.deleteOne({_id: new ObjectId(_id)});
		
		const chatMessages = await messagesCollection.find({chatId: deletedMessage?.chatId}).toArray();
		
		if (!chatMessages.length) {
			await chatsCollection.deleteOne({_id: deletedMessage?.chatId});
		}
		
		return {
			deletedMessage,
		};
	}
	
	private static async readMessage() {
		const _id = this.payload?.data._id ?? '';
		
		const messagesCollection = await getCollection('messages');
		
		await messagesCollection.updateOne({_id: new ObjectId(_id)}, {$set: {checked: true}});
		
		return {_id};
	}
	
	private static async readAllMessage() {
		const _id = this.payload?.data._id ?? '';
		
		const messagesCollection = await getCollection('messages');
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
		
		const chatsCollection = await getCollection('chats');
		const messagesCollection = await getCollection('messages');
		
		const chatsId = (await chatsCollection.find({users: new ObjectId(userId)}).toArray())
			.map((chat) => chat._id);
		
		const searchedMessages = await messagesCollection.find({
			$and: [
				{chatId: {$in: chatsId}},
				{text: {$regex: searchValue}},
			],
		}).toArray();
		
		const chats = [];
		
		for (const message of searchedMessages) {
			const chat = await chatsCollection.findOne({_id: message.chatId});
			
			if (chat) chat.lastMessage = message;
			
			chats.push(chat);
		}
		
		return {
			searchedMessages: chats,
		};
	}
	
	private static async getMessage() {
		const userId = this.payload?.data.userId ?? '';
		const chatId = this.payload?.data.chatId ?? '';
		
		const usersCollection = await getCollection('users');
		const messagesCollection = await getCollection('messages');
		const chatsCollection = await getCollection('chats');
		
		const usersId = (await chatsCollection.findOne({_id: new ObjectId(chatId), users: new ObjectId(userId)}))?.users
			.filter((id: ObjectId) => id.toString() !== userId);
		
		
		if (!usersId) return {};
		
		const users = await usersCollection.find({_id: {$in: usersId}}).toArray();
		
		const messages = await messagesCollection.find({chatId: new ObjectId(chatId)}).toArray();
		
		for (const message of messages) {
			message.author = await usersCollection.findOne({_id: message.userId});
		}
		
		return {
			users,
			messages,
		};
	}
}

export default MessageService;