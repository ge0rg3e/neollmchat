import { ACCESS_TOKEN_EXP, REFRESH_TOKEN_EXP, getExpTimestamp } from './helpers';
import { login, register } from './schema';
import authPlugin from './plugin';
import jwt from '@elysiajs/jwt';
import db from '../database';
import Elysia from 'elysia';

const authService = new Elysia({ prefix: '/api/auth' })
	.use(jwt({ name: 'jwt', secret: Bun.env.JWT_SECRET! }))
	.post(
		'/login',
		async ({ body, jwt, status, cookie: { accessToken, refreshToken } }) => {
			const user = await db.user.findUnique({ where: { username: body.username }, select: { id: true, username: true, password: true, role: true } });
			if (!user) return status(400, 'The username or password is incorrect.');

			const matchPassword = await Bun.password.verify(body.password, user.password, 'bcrypt');
			if (!matchPassword) return status(400, 'The username or password is incorrect.');

			const accessJWTToken = await jwt.sign({ sub: user.id, exp: getExpTimestamp(ACCESS_TOKEN_EXP) });
			accessToken.set({ value: accessJWTToken, httpOnly: true, maxAge: ACCESS_TOKEN_EXP, path: '/' });

			const refreshJWTToken = await jwt.sign({ sub: user.id, exp: getExpTimestamp(REFRESH_TOKEN_EXP) });
			refreshToken.set({ value: refreshJWTToken, httpOnly: true, maxAge: REFRESH_TOKEN_EXP, path: '/' });

			await db.user.update({ where: { id: user.id }, data: { refreshToken: refreshJWTToken } });

			return { session: { username: user.username, id: user.id, role: user.role }, accessToken: accessJWTToken, refreshToken: refreshJWTToken };
		},
		{ body: login }
	)
	.post(
		'/register',
		async ({ body }) => {
			const password = await Bun.password.hash(body.password, {
				algorithm: 'bcrypt',
				cost: 10
			});

			await db.user.create({ data: { username: body.username, email: body.email, password } });
			return true;
		},
		{ body: register }
	)
	.post('/refresh', async ({ cookie: { accessToken, refreshToken }, jwt, set }) => {
		if (!refreshToken.value) {
			set.status = 401;
			return { error: 'Refresh token is missing' };
		}

		const jwtPayload = await jwt.verify(refreshToken.value);
		if (!jwtPayload) {
			set.status = 403;
			return { error: 'Refresh token is invalid' };
		}

		const user = await db.user.findUnique({ where: { id: jwtPayload.sub, refreshToken: refreshToken.value }, select: { id: true, username: true, role: true, refreshToken: true } });
		if (!user) {
			set.status = 403;
			return { error: 'Refresh token is invalid' };
		}

		const accessJWTToken = await jwt.sign({ sub: user.id, exp: getExpTimestamp(ACCESS_TOKEN_EXP) });
		accessToken.set({ value: accessJWTToken, httpOnly: true, maxAge: ACCESS_TOKEN_EXP, path: '/' });

		const refreshJWTToken = await jwt.sign({ sub: user.id, exp: getExpTimestamp(REFRESH_TOKEN_EXP) });
		refreshToken.set({ value: refreshJWTToken, httpOnly: true, maxAge: REFRESH_TOKEN_EXP, path: '/' });

		await db.user.update({ where: { id: user.id }, data: { refreshToken: refreshJWTToken } });

		return { accessToken: accessJWTToken, refreshToken: refreshJWTToken };
	})
	.use(authPlugin)
	.get('/me', ({ user }) => user)
	.post('/logout', async ({ cookie: { accessToken, refreshToken }, user }) => {
		accessToken.remove();
		refreshToken.remove();

		await db.user.update({ where: { id: user.id }, data: { refreshToken: null } });
		return true;
	});

export default authService;
