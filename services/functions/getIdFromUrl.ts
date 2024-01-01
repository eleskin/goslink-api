import http from 'http';

const getParamFromUrl = (request: http.IncomingMessage): string => {
	const url = new URL(request.url ?? '', `ws://${request.headers.host}`);
	
	return url.searchParams.get('_id') ?? '';
};

export default getParamFromUrl;