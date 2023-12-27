import {ObjectId} from 'mongodb';

const createDeleteMessageResponse = async (collections: any, wss: any, {_id}: any) => {
	const {messagesCollection} = collections;
	
	messagesCollection.deleteOne({_id: new ObjectId(_id)});
};

export default createDeleteMessageResponse;