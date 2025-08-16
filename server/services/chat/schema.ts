import { t } from 'elysia';

const messages = t.Array(
	t.Object({
		id: t.String(),
		role: t.Union([t.Literal('user'), t.Literal('assistant')]),
		content: t.String(),
		attachments: t.Array(
			t.Object({
				fileName: t.String(),
				mimeType: t.String(),
				data: t.String()
			})
		)
	})
);

export const chatPost = t.Object({
	chatId: t.String(),
	requestId: t.String(),
	model: t.Object({
		id: t.String(),
		customInstructions: t.String({ default: '' })
	}),
	messages: messages
});

export const generateTitle = t.Object({
	chatId: t.String(),
	modelId: t.String(),
	messages: messages
});

export const deleteChat = t.Object({ id: t.String() });
