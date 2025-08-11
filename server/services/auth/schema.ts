import { t } from 'elysia';

export const login = t.Object({
	username: t.String(),
	password: t.String()
});

export const register = t.Object({
	username: t.String(),
	email: t.String({ format: 'email' }),
	password: t.String()
});
