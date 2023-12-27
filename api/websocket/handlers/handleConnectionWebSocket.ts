import {MongoClient, ObjectId} from 'mongodb';
import WebSocket from 'ws';

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
			
			if (connectedClients.has(firstUserId.toString()) && connectedClients.has(secondUserId.toString())) {
				ws.send(JSON.stringify({
					type: 'SET_ONLINE',
					data: {
						conversationalists: [firstUser.username, secondUser.username],
					},
				}));
			} else if (connectedClients.has(firstUserId?.toString())) {
				ws.send(JSON.stringify({
					type: 'SET_ONLINE',
					data: {
						conversationalist: firstUser.username,
					},
				}));
			} else if (connectedClients.has(secondUserId?.toString())) {
				ws.send(JSON.stringify({
					type: 'SET_ONLINE',
					data: {
						conversationalist: secondUser.username,
					},
				}));
			}
		}
	}
	
	connectedClients.add(ws._id);
};

export default handleConnectionWebSocket;