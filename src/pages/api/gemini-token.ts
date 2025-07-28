import type { APIRoute } from 'astro';
import { GoogleGenAI, type AuthToken } from '@google/genai';

export const POST: APIRoute = async ({ locals }) => {
	const { env } = locals.runtime;

	if (!env.GEMINI_SECRET_KEY) {
		return new Response(JSON.stringify({ error: 'Missing API Key' }), { status: 500 });
	}

	try {
		const client = new GoogleGenAI({ apiKey: env.GEMINI_SECRET_KEY });
		const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();

		const token: AuthToken = await client.authTokens.create({
			config: {
				uses: 1,
				expireTime: expireTime,
				httpOptions: { apiVersion: 'v1alpha' },
			},
		});

		return new Response(JSON.stringify({ token: token.name }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		console.error('Error creating Gemini token:', error);
		return new Response(JSON.stringify({ error: 'Failed to create token' }), { status: 500 });
	}
};
