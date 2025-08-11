import { cors } from '@elysiajs/cors';
import { Elysia } from 'elysia';

// Services
import frontendService from './services/frontend';
import modelsService from './services/models';
import chatService from './services/chat';
import authService from './services/auth';
import syncService from './services/sync';

const app = new Elysia()
	.use(
		cors({
			origin: Bun.env.NODE_ENV === 'production' ? undefined : 'http://localhost:8607',
			methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
			credentials: true
		})
	)
	.use(syncService)
	.use(frontendService)
	.use(chatService)
	.use(modelsService)
	.use(authService)
	.listen(8608);

console.info(`⚡ NeoLLMChat is running at http://${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
