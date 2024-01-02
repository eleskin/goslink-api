class OnlineUsers {
	private static users: Map<string, string> = new Map();
	
	public static setUser(userId: string, contactId: string) {
		this.users.set(contactId, userId)
	}
	
	public static deleteUser(contactId: string) {
		this.users.delete(contactId);
	}
	
	public static getUsers(userId: string) {
		return this.users.get(userId) ?? '';
	}
}

export default OnlineUsers;