// Utility functions
export function encode(bytes: Uint8Array): string {
	let binary = '';
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

export function decode(base64: string): Uint8Array {
	const binaryString = atob(base64);
	const len = binaryString.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return bytes;
}

export function createBlob(data: Uint8Array) {
	const l = data.length;
	const int16 = new Int16Array(l);
	for (let i = 0; i < l; i++) {
		// convert float32 -1 to 1 to int16 -32768 to 32767
		int16[i] = data[i] * 32768;
	}
	return {
		data: encode(new Uint8Array(int16.buffer)),
		mimeType: 'audio/pcm;rate=16000',
	};
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
	const buffer = ctx.createBuffer(numChannels, data.length / 2 / numChannels, sampleRate);
	const dataInt16 = new Int16Array(data.buffer);
	const l = dataInt16.length;
	const dataFloat32 = new Float32Array(l);
	for (let i = 0; i < l; i++) {
		dataFloat32[i] = dataInt16[i] / 32768.0;
	}
	// Extract interleaved channels
	if (numChannels === 0) {
		buffer.copyToChannel(dataFloat32, 0);
	} else {
		for (let i = 0; i < numChannels; i++) {
			const channel = dataFloat32.filter((_, index) => index % numChannels === i);
			buffer.copyToChannel(channel, i);
		}
	}
	return buffer;
}
