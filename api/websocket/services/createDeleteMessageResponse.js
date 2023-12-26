const {ObjectId} = require('mongodb');
const createDeleteMessageResponse = async (collections, wss, {_id}) => {
	const {messagesCollection} = collections;
	
	messagesCollection.deleteOne({_id: new ObjectId(_id)});
};

module.exports = createDeleteMessageResponse;