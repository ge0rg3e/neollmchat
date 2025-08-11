import { llmRequest, type LLMResponse } from './llm-api';
import { decryptContent } from '../content-encryption';
import type { Message } from '~frontend/lib/types';
import { v4 as uuid } from 'uuid';
import db from '../database';

export const sseEvent = (data: any) => `data: ${JSON.stringify(data)}\n\n`;

export const SYSTEM_PROMPT =
	'You are a helpful assistant responding in markdown with code blocks, lists, links (from web search), and clear formatting. Make sure to response in same language as user input.' as const;

export const getOrCreateChat = async (chatId: string, userId: string) => {
	let chat = await db.chat.findUnique({ where: { id: chatId } });
	if (!chat) {
		chat = await db.chat.create({
			data: {
				id: chatId,
				title: 'New chat',
				messages: [],
				createdBy: userId
			}
		});
	}
	return chat;
};

export const saveMessages = async (chatId: string, messages: Message[], content: string, modelId: string) => {
	const updatedMessages = [...messages, { id: uuid(), role: 'assistant' as const, content, attachments: [], modelId }];
	try {
		await db.chat.update({ where: { id: chatId }, data: { messages: updatedMessages } });
	} catch (error) {
		console.error('Error saving messages:', error);
	}
};

export const getModel = async (modelId: string) => {
	const model = await db.model.findUnique({ where: { id: modelId } });
	if (!model) return null;

	const decryptedApiKey = (await decryptContent(model.apiKey)) as string;
	return { id: model.id, model: model.model, provider: model.provider, apiUrl: model.apiUrl, decryptedApiKey };
};

export type SearchResult = {
	url: string;
	title: string;
	content: string;
};
