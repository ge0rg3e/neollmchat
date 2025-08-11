import authPlugin from './auth/plugin';
import { Elysia } from 'elysia';
import db from './database';

const syncService = new Elysia({ prefix: '/api' }).use(authPlugin).get('/sync', async ({ user }) => {
	const models = await db.model.findMany({ select: { id: true, model: true, provider: true } });
	const chats = await db.chat.findMany({ where: { createdBy: user.id } });

	return { models, chats };
});

export default syncService;
