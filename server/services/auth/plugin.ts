import jwt from '@elysiajs/jwt';
import db from '../database';
import Elysia from 'elysia';

const authPlugin = (app: Elysia) =>
	app
		.use(
			jwt({
				name: 'jwt',
				secret: Bun.env.JWT_SECRET!
			})
		)
		.derive(async ({ jwt, cookie: { accessToken }, set }) => {
			if (!accessToken.value) {
				set.status = 401;
				throw new Error('Access token is missing');
			}

			const jwtPayload = await jwt.verify(accessToken.value);
			if (!jwtPayload) {
				set.status = 403;
				throw new Error('Access token is invalid');
			}

			const user = await db.user.findUnique({
				where: {
					id: String(jwtPayload.sub)
				},
				select: { id: true, username: true, role: true }
			});
			if (!user) {
				set.status = 403;
				throw new Error('Access token is invalid');
			}

			return { user };
		});

export default authPlugin;
