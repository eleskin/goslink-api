import client from '../client';

const mongoDbClient = client.connect();

const getCollection = async (collection: string) => {
	return (await mongoDbClient).db('goslink').collection(collection);
};

export default getCollection;