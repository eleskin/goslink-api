import {ObjectId} from 'mongodb';

type Message = {
	_id: string | ObjectId;
	chatId: string | ObjectId;
};

export default Message;