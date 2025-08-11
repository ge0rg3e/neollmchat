import { randomBytes, subtle } from 'crypto';

const ENCRYPTION_KEY = process.env.CONTENT_ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
	throw new Error('CONTENT_ENCRYPTION_KEY environment variable is not set');
}

export const deriveKey = async (salt: Uint8Array) => {
	const enc = new TextEncoder();
	const keyMaterial = await subtle.importKey('raw', enc.encode(ENCRYPTION_KEY), 'PBKDF2', false, ['deriveBits', 'deriveKey']);
	return subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt,
			iterations: 100000,
			hash: 'SHA-256'
		},
		keyMaterial,
		{ name: 'AES-GCM', length: 256 },
		true,
		['encrypt', 'decrypt']
	);
};

export const encryptContent = async (input: string) => {
	try {
		const enc = new TextEncoder();
		const salt = randomBytes(16);
		const iv = randomBytes(12);
		const key = await deriveKey(salt);

		const encrypted = await subtle.encrypt(
			{
				name: 'AES-GCM',
				iv
			},
			key,
			enc.encode(input)
		);

		// Combine salt, iv, and encrypted data
		const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
		combined.set(salt, 0);
		combined.set(iv, salt.length);
		combined.set(new Uint8Array(encrypted), salt.length + iv.length);

		// Convert to base64 for string output
		return Buffer.from(combined).toString('base64');
	} catch (error) {
		throw new Error(`Encryption failed: ${error}`);
	}
};

export const decryptContent = async (input: string) => {
	try {
		const combined = Buffer.from(input, 'base64');
		const salt = combined.subarray(0, 16);
		const iv = combined.subarray(16, 28);
		const encryptedData = combined.subarray(28);

		const key = await deriveKey(salt);

		const decrypted = await subtle.decrypt(
			{
				name: 'AES-GCM',
				iv
			},
			key,
			encryptedData
		);

		return new TextDecoder().decode(decrypted);
	} catch (error) {
		throw new Error(`Decryption failed: ${error}`);
	}
};
