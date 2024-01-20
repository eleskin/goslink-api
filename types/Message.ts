import {ObjectId} from 'mongodb';

type Message = {
	_id: string | ObjectId;
	chatId: string | ObjectId;
	dateObject: Date;
};

export default Message;