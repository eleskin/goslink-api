const createNewMessageResponse = require('./createNewMessageResponse');
const sendResponse = (type, wss, params) => {
	switch (type) {
		case 'NEW_MESSAGE':
			createNewMessageResponse(type, wss, params);
	}
};

module.exports = sendResponse;