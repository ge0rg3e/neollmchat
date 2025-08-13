import { t } from 'elysia';

export const transcribe = t.Object({
	recording: t.File(),
	language: t.String()
});
