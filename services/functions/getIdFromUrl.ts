import http from 'http';

const getParamFromUrl = (request: http.IncomingMessage, param: string): string => {
	const url = new URL(request.url ?? '', `ws://${request.headers.host}`);
	
	return url.searchParams.get(param) ?? '';
};

export default getParamFromUrl;