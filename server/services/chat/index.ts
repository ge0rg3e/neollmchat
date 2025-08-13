import { getOrCreateChat, saveMessages, sseEvent, SYSTEM_PROMPT } from './helpers';
import { llmRequest, LLMResponse, type LLMStreamResponse } from './llm-api';
import { chatPost, deleteChat, generateTitle } from './schema';
import type { Chat } from '~frontend/lib/types';
import authPlugin from '../auth/plugin';
import db from '../database';
import Elysia from 'elysia';

const chatService = new Elysia({ prefix: '/api' })
	.use(authPlugin)
	.post(
		'/chat',
		async function* ({ body, request, user }) {
			const abortController = new AbortController();
			const abortSignal = request.signal;
			let isStreamClosed = false;
			const aiResponseChunks: string[] = [];

			const handleAbort = async () => {
				if (isStreamClosed) return;
				const content = aiResponseChunks.join('') + '\n\n**⛔ Stopped**';
				await saveMessages(body.chatId, body.messages, content, body.model.id);
				abortController.abort();
				isStreamClosed = true;
			};

			abortSignal.addEventListener('abort', handleAbort, { once: true });

			await getOrCreateChat(body.chatId, user.id);

			const formattedMessages: any[] = body.messages.map((message) => ({
				id: message.id,
				role: message.role as any,
				content: [
					{ type: 'text', text: message.content },
					...message.attachments.map((attachment) => ({
						type: 'image_url' as const,
						image_url: {
							url: `data:${attachment.mimeType};base64,${attachment.data}`
						}
					}))
				]
			}));

			const { data, error } = await llmRequest({
				modelId: body.model.id,
				messages: [
					{
						role: 'system',
						content: [{ type: 'text', text: SYSTEM_PROMPT }]
					},
					...formattedMessages
				],
				stream: true,
				abortController
			});

			if (error) {
				yield sseEvent({ id: body.requestId, role: 'assistant', content: `**⚠️ ${error}**`, done: true });
				abortController.abort();
				isStreamClosed = true;
				abortSignal.removeEventListener('abort', handleAbort);
				return;
			}

			for await (const chunk of data as LLMStreamResponse) {
				if (abortSignal.aborted || isStreamClosed) break;
				if (chunk.content) aiResponseChunks.push(chunk.content);

				// Temporary fix - https://github.com/elysiajs/elysia/issues/742
				yield sseEvent({
					id: body.requestId,
					role: 'assistant',
					content: chunk.content,
					done: chunk.done
				});

				if (chunk.done) {
					await saveMessages(body.chatId, body.messages, aiResponseChunks.join(''), body.model.id);
					break;
				}
			}
		},
		{ body: chatPost }
	)
	.post(
		'/chat/generateTitle',
		async ({ body, status }) => {
			const chat = await db.chat.findUnique({ where: { id: body.chatId }, select: { title: true } });
			if (!chat) return status(404, 'Chat not found.');

			if (chat.title !== 'New chat') return status(400, 'Chat has a title.');

			const conversationText = body.messages.map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n');
			const prompt = `Summarize the following conversation in a single sentence of 5-10 words, capturing the main topic or purpose:\n\n${conversationText}`;

			const { data, error } = await llmRequest({
				modelId: body.modelId,
				messages: [
					{ role: 'system', content: 'You are a helpful assistant that generates concise conversation titles.' },
					{ role: 'user', content: prompt }
				],
				params: {
					max_tokens: 20,
					temperature: 0.5
				},
				stream: false,
				abortController: new AbortController()
			});

			if (error) return status(500, error);

			const title = (data as LLMResponse).content;
			if (!title) return status(500, 'Failed to generate title.');

			await db.chat.update({ where: { id: body.chatId }, data: { title } });

			return { title };
		},
		{ body: generateTitle }
	)
	.delete(
		'/chat',
		async ({ body, user, status }) => {
			try {
				await db.chat.deleteMany({ where: { id: body.id, createdBy: user.id } });
				return true;
			} catch {
				return status(500, 'Failed to delete chat.');
			}
		},
		{ body: deleteChat }
	)
	.get('/chats', async ({ user, status }) => {
		try {
			const chats = await db.chat.findMany({ where: { createdBy: user.id } });
			return chats as any as Chat[];
		} catch {
			return status(500, 'Failed to get chats.');
		}
	})
	.delete('/chats', async ({ user, status }) => {
		try {
			await db.chat.deleteMany({ where: { createdBy: user.id } });
			return true;
		} catch {
			return status(500, 'Failed to delete chats.');
		}
	});

export default chatService;
