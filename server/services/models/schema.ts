import { t } from 'elysia';

export const createModel = t.Object({
	model: t.String(),
	provider: t.String(),
	apiUrl: t.String(),
	apiKey: t.String(),
	attributes: t.Object({
		imageUpload: t.Boolean(),
		imageGeneration: t.Boolean(),
		thinkingMode: t.Boolean()
	})
});

export const deleteModel = t.Object({
	id: t.String()
});
