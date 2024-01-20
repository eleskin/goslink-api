import {ObjectId} from 'mongodb';
import User from './User';

type Message = {
	_id: string | ObjectId;
	chatId: string | ObjectId;
	dateObject: Date;
	author: User;
};

export default Message;