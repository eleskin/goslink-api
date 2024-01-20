import {ObjectId} from 'mongodb';
import Message from './Message';

type Chat = {
	_id: string | ObjectId;
	users: ObjectId[];
	group: boolean;
	name: string;
	lastMessage: Message;
};

export default Chat;