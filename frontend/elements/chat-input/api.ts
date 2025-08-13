import apiClient, { parseChatChunk } from '~frontend/lib/api';
import { scrollToLastMessage } from '~frontend/lib/utils';
import type { Chat, Message } from '~frontend/lib/types';
import { useNavigate, useParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '~frontend/lib/context';
import db from '~frontend/lib/dexie';
import { v4 as uuid } from 'uuid';

const useChatApi = () => {
	const navigate = useNavigate();
	const { id: chatId } = useParams();
	const chats = useLiveQuery(() => db.chats.toArray());
	const activeRequests = useLiveQuery(() => db.activeRequests.toArray());
	const { abortControllers, setAbortControllers, settings, chatInput, setChatInput, session } = useApp();

	const createNewChat = async () => {
		const newChatId = uuid();
		await db.chats.add({
			id: newChatId,
			title: 'New chat',
			messages: [],
			createdBy: session!.id!,
			createdAt: new Date()
		});
		navigate(`/c/${newChatId}`);

		// Return the new chat object directly
		return { id: newChatId, messages: [] };
	};

	const sendMessage = async () => {
		const input = chatInput.text.trim();
		const attachments = chatInput.attachments;

		if (!input || !settings.selectedModel) return;

		// Get or create chat
		let targetChatId: string;
		let chat = chatId ? chats?.find((c) => c.id === chatId) : null;

		if (!chat) {
			chat = (await createNewChat()) as any as Chat;
			targetChatId = chat!.id;
		} else {
			targetChatId = chatId!;
		}

		// Add user message
		const requestId = uuid();
		const userMessage: Message = { id: requestId, role: 'user', content: input, attachments };
		const updatedMessages: Message[] = [...chat!.messages, userMessage];

		await db.chats.update(targetChatId, { messages: updatedMessages });

		// Reset input
		setChatInput({ text: '', attachments: [] });

		scrollToLastMessage();

		// Send request to LLM
		const abortController = new AbortController();

		await db.activeRequests.add({ requestId, chatId: targetChatId });
		setAbortControllers((prev) => [...prev, { requestId, controller: abortController }]);

		try {
			const response = await apiClient.chat.post(
				{ chatId: targetChatId, requestId, model: { id: settings.selectedModel.id }, messages: updatedMessages },
				{ fetch: { signal: abortController.signal } }
			);
			if (!response.data) return;

			// Process streaming response
			let assistantContent = '';
			const assistantMessageId = uuid();

			for await (const chunk of response.data) {
				const data = parseChatChunk(chunk);
				if (!data) continue;

				assistantContent += data.content;
				await db.chats.update(targetChatId, { messages: [...updatedMessages, { id: assistantMessageId, role: 'assistant', content: assistantContent, attachments: [] }] });

				if (data.done) {
					scrollToLastMessage();
					await db.activeRequests.delete(requestId);
					setAbortControllers((prev) => prev.filter((c) => c.requestId !== requestId));

					if (chat.title === 'New chat' || chat.title === undefined) {
						await generateTitle(targetChatId, updatedMessages.slice(0, 2));
					}
					break;
				}
			}
		} catch (err) {
			await db.activeRequests.delete(requestId);
			setAbortControllers((prev) => prev.filter((c) => c.requestId !== requestId));
			console.error('>> NeoLLMChat - Failed to send chat request.', err);
		}
	};

	const stopRequest = async () => {
		if (!chatId) return;

		const activeRequest = activeRequests?.find((r) => r.chatId === chatId);
		if (!activeRequest) return;

		const abortController = abortControllers?.find((c) => c.requestId === activeRequest.requestId);
		abortController?.controller.abort();

		const chat = chats?.find((c) => c.id === chatId);
		const lastMessage = chat?.messages[chat.messages.length - 1];

		if (lastMessage?.role === 'assistant') {
			const updatedContent = `${lastMessage.content}\n\n**⛔ Stopped**`;
			const updatedMessages = [...chat!.messages];
			updatedMessages[updatedMessages.length - 1] = { ...lastMessage, content: updatedContent };
			await db.chats.update(chatId, { messages: updatedMessages });
		}

		await db.activeRequests.delete(activeRequest.requestId);
		setAbortControllers((prev) => prev.filter((c) => c.requestId !== activeRequest.requestId));
	};

	const regenerateMessage = async (messageId: string) => {
		if (!chatId) return; // Guard against undefined chatId

		try {
			const chat = chats?.find((c) => c.id === chatId);
			if (!chat || !settings.selectedModel) return;

			const messageIndex = chat.messages.findIndex((m) => m.id === messageId);
			if (messageIndex === -1) return;

			// Keep messages up to the one we want to regenerate
			const messagesToKeep = chat.messages.slice(0, messageIndex);
			if (!messagesToKeep.length) return;

			// Update chat with truncated message history
			await db.chats.update(chatId, { messages: messagesToKeep });

			// Create new request
			const requestId = uuid();
			const abortController = new AbortController();
			await db.activeRequests.add({ requestId, chatId });
			setAbortControllers((prev) => [...prev, { requestId, controller: abortController }]);

			try {
				const response = await apiClient.chat.post(
					{
						chatId,
						requestId,
						model: { id: settings.selectedModel.id },
						messages: messagesToKeep
					},
					{ fetch: { signal: abortController.signal } }
				);

				if (!response.data) {
					await db.activeRequests.delete(requestId);
					setAbortControllers((prev) => prev.filter((c) => c.requestId !== requestId));
					return;
				}

				// Process streaming response
				let assistantContent = '';
				const assistantMessageId = uuid();

				for await (const chunk of response.data) {
					const data = parseChatChunk(chunk);
					if (!data) continue;

					assistantContent += data.content;

					await db.chats.update(chatId, { messages: [...messagesToKeep, { id: assistantMessageId, role: 'assistant', content: assistantContent, attachments: [] }] });

					if (data.done) {
						await db.activeRequests.delete(requestId);
						setAbortControllers((prev) => prev.filter((c) => c.requestId !== requestId));
						break;
					}
				}
			} catch (err) {
				console.error('>> NeoLLMChat - Failed to regenerate message.', err);
				await db.activeRequests.delete(requestId);
				setAbortControllers((prev) => prev.filter((c) => c.requestId !== requestId));
			}
		} catch (err) {
			console.error('>> NeoLLMChat - Failed to regenerate message.', err);
		}
	};

	const editMessage = async (messageId: string, newContent: string) => {
		if (!chatId) return;

		try {
			const chat = chats?.find((c) => c.id === chatId);
			if (!chat || !settings.selectedModel) return;

			const messageIndex = chat.messages.findIndex((m) => m.id === messageId);
			if (messageIndex === -1) return;

			// Update the message content
			const updatedMessages = [...chat.messages];
			updatedMessages[messageIndex] = { ...updatedMessages[messageIndex], content: newContent.trim() };

			// Update chat with new message content
			await db.chats.update(chatId, { messages: updatedMessages });

			// Regenerate response by keeping messages up to and including the edited message
			const messagesToKeep = updatedMessages.slice(0, messageIndex + 1);
			if (!messagesToKeep.length) return;

			// Create new request
			const requestId = uuid();
			const abortController = new AbortController();
			await db.activeRequests.add({ requestId, chatId });
			setAbortControllers((prev) => [...prev, { requestId, controller: abortController }]);

			try {
				const response = await apiClient.chat.post(
					{
						chatId,
						requestId,
						model: { id: settings.selectedModel.id },
						messages: messagesToKeep
					},
					{ fetch: { signal: abortController.signal } }
				);

				if (!response.data) {
					await db.activeRequests.delete(requestId);
					setAbortControllers((prev) => prev.filter((c) => c.requestId !== requestId));
					return;
				}

				// Process streaming response
				let assistantContent = '';
				const assistantMessageId = uuid();

				for await (const chunk of response.data) {
					const data = parseChatChunk(chunk);
					if (!data) continue;

					assistantContent += data.content;

					await db.chats.update(chatId, { messages: [...messagesToKeep, { id: assistantMessageId, role: 'assistant', content: assistantContent, attachments: [] }] });

					if (data.done) {
						await db.activeRequests.delete(requestId);
						setAbortControllers((prev) => prev.filter((c) => c.requestId !== requestId));
						break;
					}
				}
			} catch (err) {
				console.error('>> NeoLLMChat - Failed to regenerate edited message.', err);
				await db.activeRequests.delete(requestId);
				setAbortControllers((prev) => prev.filter((c) => c.requestId !== requestId));
			}
		} catch (err) {
			console.error('>> NeoLLMChat - Failed to edit message.', err);
		}
	};

	const generateTitle = async (chatId: string, messages: Message[]) => {
		const { data } = await apiClient.chat.generateTitle.post({ chatId, modelId: settings.selectedModel!.id, messages });
		if (!data) return;

		await db.chats.update(chatId, { title: data.title });
	};

	return {
		chatId,
		regenerateMessage,
		sendMessage,
		stopRequest,
		editMessage
	};
};

export default useChatApi;
