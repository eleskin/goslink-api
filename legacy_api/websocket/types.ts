export type webSocketResponseMessagesTypes = 'NEW_MESSAGE' | 'GET_MESSAGES' | 'EDIT_MESSAGE' | 'DELETE_MESSAGE';
export type WebSocketChatServer = WebSocket & { _id: string; roomName: string };