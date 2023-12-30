const messageService = (payload: { type: string; data: any }) => {
	console.log(payload);
};

export default messageService;