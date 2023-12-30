import client from '../../../services/client';

const getCollections = async () => {
	await client.connect();
	
	const messagesCollection = client.db('main').collection('messages');
	const roomsCollection = client.db('main').collection('rooms');
	const usersCollection = client.db('main').collection('users');
	
	return {messagesCollection, roomsCollection, usersCollection};
};

export default getCollections;