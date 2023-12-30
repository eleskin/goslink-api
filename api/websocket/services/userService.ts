import getCollections from '../utils/getCollections';
import {ObjectId} from 'mongodb';
import WebSocket from 'ws';

export const getUser = async (payload: { type: string; data: any }) => {
	const {usersCollection} = await getCollections();
	
	return await usersCollection.findOne({_id: new ObjectId(payload.data.conversationalistId)});
};

const userService = async (ws: WebSocket & { _id: string; roomId: string }, payload: {
	type: string;
	data: any
}) => {
	const {type} = payload;
	
	switch (type) {
		case 'GET_USER':
			return JSON.stringify({
				type,
				data: {
					user: await getUser(payload),
				},
			});
	}
	
	return JSON.stringify(null);
};

export default userService;