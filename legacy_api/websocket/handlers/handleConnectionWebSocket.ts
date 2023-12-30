import {MongoClient, ObjectId} from 'mongodb';
import WebSocket from 'ws';

const createResponse = (
	ws: WebSocket,
	hasFirstUser: boolean,
	hasSecondUser: boolean,
	firstUsername: string,
	secondUsername: string,
) => {
	let conversationalists: string[] = [];
	
	if (hasFirstUser && hasSecondUser) conversationalists = [firstUsername, secondUsername];
	else if (hasFirstUser) conversationalists = [firstUsername];
	else if (hasSecondUser) conversationalists = [secondUsername];
	
	return () => ws.send(JSON.stringify({
		type: 'SET_ONLINE',
		data: {conversationalists},
	}));
};

const handleConnectionWebSocket = async (
	client: MongoClient,
	wss: WebSocket.Server,
	ws: WebSocket & { _id: string },
	connectedClients: Set<string>,
) => {
	const usersCollection = client.db('main').collection('users');
	
	const actualRooms: string[] = Array.from(wss.clients).map((client: any) => client.roomName);
	
	const user = await usersCollection.findOne({_id: new ObjectId(ws._id)});
	
	if (!user || connectedClients.has(user._id.toString())) return;
	
	const onlineRooms = actualRooms
		.filter((room) => room?.includes(user.username))
		.map((room) => room.split('|'));
	
	if (onlineRooms.length) {
		for (const roomsUsers of onlineRooms) {
			const [firstUserUsername, secondUserUsername] = roomsUsers;
			
			const firstUser = await usersCollection.findOne({username: firstUserUsername});
			const secondUser = await usersCollection.findOne({username: secondUserUsername});
			
			if (!firstUser || !secondUser) return;
			
			const firstUserId = firstUser._id;
			const secondUserId = secondUser._id;
			
			createResponse(
				ws,
				connectedClients.has(firstUserId.toString()),
				connectedClients.has(secondUserId.toString()),
				firstUser.username,
				secondUser.username,
			)();
		}
	}
	
	connectedClients.add(ws._id);
};

export default handleConnectionWebSocket;