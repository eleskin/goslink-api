const handleCloseWebSocket = (connectedClients: Set<string>, _id: string) => {
	connectedClients.delete(_id);
};

export default handleCloseWebSocket;