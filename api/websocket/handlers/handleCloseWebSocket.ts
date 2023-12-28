import WebSocket from 'ws';

const handleCloseWebSocket = (wss: WebSocket.Server, connectedClients: Set<string>, _id: string) => {
	connectedClients.delete(_id);
};

export default handleCloseWebSocket;