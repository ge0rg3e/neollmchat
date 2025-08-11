import type { App } from '~server/index';
import { treaty } from '@elysiajs/eden';

const treatyClient = treaty<App>(window.location.origin.endsWith(':8607') ? 'http://localhost:8608' : window.location.origin, {
	fetch: {
		credentials: 'include'
	}
});

export const parseChatChunk = (input: string) => {
	const cleanString = input.trim().replace(/^data:\s?/, '');

	try {
		const parsedData = JSON.parse(cleanString);

		return {
			id: parsedData.id,
			role: parsedData.role as 'user' | 'assistant',
			content: parsedData.content,
			done: parsedData.done
		} as {
			id: string;
			role: 'user' | 'assistant';
			content: string;
			done: boolean;
		};
	} catch {
		return null;
	}
};

const apiClient = treatyClient.api;
export default apiClient;
