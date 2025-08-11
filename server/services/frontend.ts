import { staticPlugin } from '@elysiajs/static';
import { Elysia } from 'elysia';
import { join } from 'path';

const getMimeType = (path: string): string => {
	if (path.endsWith('.js') || path.endsWith('.mjs')) return 'application/javascript';
	if (path.endsWith('.css')) return 'text/css';
	if (path.endsWith('.png')) return 'image/png';
	if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
	if (path.endsWith('.svg')) return 'image/svg+xml';
	if (path.endsWith('.json')) return 'application/json';
	if (path.endsWith('.html')) return 'text/html';

	return 'application/octet-stream';
};

const assetsRoute = async ({ path, set }: any) => {
	const filePath = join('./build/frontend', path.replace('/', ''));
	const file = Bun.file(filePath);

	if (await file.exists()) {
		set.headers['Content-Type'] = getMimeType(path);
		return file;
	}

	set.status = 404;
	return 'Asset Not Found';
};

const frontendService = new Elysia()
	.use(
		staticPlugin({
			assets: './build/frontend',
			indexHTML: false,
			prefix: '/'
		})
	)
	.get('/assets/*', assetsRoute)
	.get('/images/*', assetsRoute)
	.get('*', async ({ path, set }) => {
		if (
			path.startsWith('/assets/') ||
			path.endsWith('.js') ||
			path.endsWith('.css') ||
			path.endsWith('.png') ||
			path.endsWith('.jpg') ||
			path.endsWith('.jpeg') ||
			path.endsWith('.svg') ||
			path.endsWith('.json')
		) {
			set.status = 404;
			return 'Not Found';
		}

		try {
			const indexPath = join('./build/frontend', 'index.html');
			const indexContent = await Bun.file(indexPath).text();
			set.headers['Content-Type'] = 'text/html';
			return new Response(indexContent);
		} catch {
			set.status = 404;
			return 'Not Found';
		}
	});

export default frontendService;
