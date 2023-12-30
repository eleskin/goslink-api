import {ObjectId} from 'mongodb';
import DeleteMessageResponse from '../interfaces/DeleteMessageResponse';

const createDeleteMessageResponse = async (payload: DeleteMessageResponse) => {
	const {messagesCollection} = payload.collections;
	
	await messagesCollection.deleteOne({_id: new ObjectId(payload.data._id)});
};

export default createDeleteMessageResponse;