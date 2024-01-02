class OnlineUsers {
	private static users: Map<string, Set<string>> = new Map();
	
	public static setUser(contactId: string, userId: string) {
		this.users.set(contactId, new Set([...(this.users.get(contactId)?.values() || []), userId]));
	}
	
	public static deleteUser(contactId: string) {
		this.users.delete(contactId);
	}
	
	public static getUsers(userId: string) {
		return this.users.get(userId) ?? new Set();
	}
}

export default OnlineUsers;