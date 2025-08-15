import { encryptContent } from '../content-encryption';
import { createModel, deleteModel } from './schema';
import authPlugin from '../auth/plugin';
import db from '../database';
import Elysia from 'elysia';

const modelsService = new Elysia({ prefix: '/api' })
	.use(authPlugin)
	.post(
		'/models',
		async ({ body, user, status }) => {
			if (user.role !== 'admin') return status(401, 'Admin role is required.');

			const ecryptedApiKey = await encryptContent(body.apiKey);

			const newModel = await db.model.create({
				data: { model: body.model, provider: body.provider, apiUrl: body.apiUrl, apiKey: ecryptedApiKey, attributes: JSON.stringify(body.attributes), createdBy: user.id },
				select: { id: true, model: true, provider: true, attributes: true }
			});

			return { ...newModel, attributes: JSON.parse(newModel.attributes) };
		},
		{ body: createModel }
	)
	.delete(
		'/models',
		async ({ body, user, status }) => {
			if (user.role !== 'admin') return status(401, 'Admin role is required.');

			try {
				await db.model.delete({ where: { id: body.id } });
				return true;
			} catch {
				return status(500, 'Error deleting model.');
			}
		},
		{ body: deleteModel }
	);

export default modelsService;
