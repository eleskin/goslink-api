import {Collection} from 'mongodb';

interface DeleteMessageResponse {
	collections: { [key: string]: Collection };
	data: {
		_id: string;
	};
}

export default DeleteMessageResponse;