import { logError } from '~server/helpers';
import authPlugin from '../auth/plugin';
import { transcribe } from './schema';
import { v4 as uuid } from 'uuid';
import Elysia from 'elysia';
import { $ } from 'bun';

const model = process.env.WHISPER_MODEL || 'small';
const device = process.env.WHISPER_DEVICE || 'cpu';

const transcribeService = new Elysia({ prefix: '/api' }).use(authPlugin).post(
	'/transcribe',
	async ({ body }) => {
		// Define rec temp path
		const recDir = `/tmp/neollmchat/transcribe_${uuid()}.wav`;

		// Save recording
		await Bun.write(recDir, body.recording);

		let computeType: string | null = null;
		if (device === 'cuda') computeType = 'float32';
		if (device === 'cpu') computeType = 'int8';

		// Transcribe with Whisper
		try {
			const result = await $`python3 -c "from faster_whisper import WhisperModel; model=WhisperModel('${model}', device='${device}', compute_type='${computeType}'); \
print((lambda: (lambda segments: ''.join(s.text for s in segments))(*model.transcribe('${recDir}', beam_size=5)[:1]))() if True else None)"
`
				.quiet()
				.text();

			if (result === 'null') return { result: null };

			return { result };
		} catch (err) {
			logError('Transcribe failed', err);
			return { result: null };
		} finally {
			await $`rm -f "${recDir}"`.quiet();
		}
	},
	{ body: transcribe }
);

export default transcribeService;
