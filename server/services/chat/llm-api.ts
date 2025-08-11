import axios, { isAxiosError } from 'axios';
import { getModel } from './helpers';
import { Readable } from 'stream';

interface LLMRequestParams {
	modelId: string;
	messages: any[];
	stream?: boolean;
	abortController: AbortController;
	params?: {
		max_tokens?: number;
		temperature?: number;
	};
}

export type LLMStreamResponse = AsyncGenerator<{ content: string | null; done: boolean }, void, unknown>;
export type LLMResponse = { content: string };

async function* parseStream(readable: Readable) {
	let buffer = '';
	for await (const chunk of readable) {
		buffer += chunk.toString();

		const lines = buffer.split('\n');
		buffer = lines.pop()!;

		for (const line of lines) {
			if (line.trim().startsWith('data:')) {
				const dataStr = line.replace(/^data:/, '').trim();
				if (dataStr === '[DONE]') {
					yield { content: '', done: true };
					return;
				}
				try {
					const json = JSON.parse(dataStr);
					const content = json.choices?.[0]?.delta?.content;
					const finishReason = json.choices?.[0]?.finish_reason;
					if (content) {
						yield { content, done: false };
					}
					if (finishReason === 'stop') {
						yield { content: '', done: true };
						return;
					}
				} catch {}
			}
		}
	}
}

export const llmRequest = async ({ modelId, messages, stream = false, abortController, params }: LLMRequestParams) => {
	const model = await getModel(modelId);
	if (!model) return { data: null, error: 'Model not found.' };

	try {
		let headers: any = {
			Authorization: `Bearer ${model.decryptedApiKey}`,
			'Content-Type': 'application/json'
		};

		const axiosConfig: any = {
			signal: abortController.signal,
			headers
		};
		if (stream) axiosConfig.responseType = 'stream';

		const { data } = await axios.post(
			`${model.apiUrl}/chat/completions`,
			{
				model: model.model,
				messages,
				stream,
				...(params ? params : {})
			},
			axiosConfig
		);

		if (stream) {
			return { data: parseStream(data), error: null };
		} else {
			const content = data?.choices[0]?.message?.content ?? null;
			return { data: { content }, error: null };
		}
	} catch (error) {
		console.log(error);
		if (isAxiosError(error)) {
			let errorMessage = 'An error occurred.';

			if (error.response?.status === 401) errorMessage = 'Unauthorized.';
			if (error.response?.status === 404) errorMessage = 'Model not found.';
			if (error.response?.status === 429) errorMessage = 'Rate limit exceeded.';
			if (error.response?.status === 500) errorMessage = 'Internal server error.';
			if (error.response?.status === 502) errorMessage = 'Bad gateway.';
			if (error.response?.status === 503) errorMessage = 'Service unavailable.';
			if (error.response?.status === 504) errorMessage = 'Gateway timeout.';

			return { data: null, error: errorMessage };
		}
		return { data: null, error: 'An error occurred.' };
	}
};
