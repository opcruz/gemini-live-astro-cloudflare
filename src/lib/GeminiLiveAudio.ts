// src/lib/GeminiLiveAudio.ts

import { GoogleGenAI, LiveServerMessage, Modality, Session } from '@google/genai';
import { decodeAudioData, decode, createBlob } from '../utils/audio';
import { AudioVisualizer } from './AudioVisualizer';
import { UIController } from './UIController';

export class GeminiLiveAudio {
	private apiKey: string;
	private isRecording = false;
	private status = '';
	private error = '';
	private nextStartTime = 0;

	private sources = new Set<AudioBufferSourceNode>();
	private session: Session | null = null;
	private client: GoogleGenAI;

	private inputAudioContext: AudioContext;
	private outputAudioContext: AudioContext;
	private inputNode: GainNode;
	private outputNode: GainNode;

	private mediaStream: MediaStream | null = null;
	private sourceNode: MediaStreamAudioSourceNode | null = null;
	private scriptProcessorNode: ScriptProcessorNode | null = null;

	private ui: UIController;
	private visualizer: AudioVisualizer;

	constructor(apiKey: string, ui: UIController, visualizer: AudioVisualizer) {
		this.apiKey = apiKey;
		this.ui = ui;
		this.visualizer = visualizer;

		this.inputAudioContext = new AudioContext({ sampleRate: 16000 });
		this.outputAudioContext = new AudioContext({ sampleRate: 24000 });

		this.inputNode = this.inputAudioContext.createGain();
		this.outputNode = this.outputAudioContext.createGain();

		this.visualizer.setup(this.outputNode, this.outputAudioContext);
		this.startRecording = this.startRecording.bind(this);
		this.stopRecording = this.stopRecording.bind(this);
		this.reset = this.reset.bind(this);
		this.ui.bindHandlers({
			onStart: () => this.startRecording(),
			onStop: () => this.stopRecording(),
			onReset: () => this.reset(),
		});
	}

	async initialize() {
		this.updateStatus('Initializing...');
		try {
			this.client = new GoogleGenAI({
				apiKey: this.apiKey,
				httpOptions: { apiVersion: 'v1alpha' },
			});
			await this.initSession();
		} catch (e) {
			this.handleError(e);
		}
	}

	private async initSession() {
		this.session = await this.client.live.connect({
			model: 'gemini-live-2.5-flash-preview',
			callbacks: {
				onopen: () => this.updateStatus('Connected to Gemini'),
				onmessage: async message => this.handleMessage(message),
				onerror: e => this.handleError(e),
				onclose: e => this.updateStatus('Connection closed: ' + e.reason),
			},
			config: {
				responseModalities: [Modality.AUDIO],
				speechConfig: {
					voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
					languageCode: 'es-US',
				},
				systemInstruction: {
					parts: [
						{
							text: "Eres Fernanda, la asistente de reservaciones del restaurante 'La Mayor', tu objetivo es ayudar a los usuarios a reservar una mesa en el restaurante.",
						},
					],
				},
				// tools: [{ googleSearch: {} }],
				tools: [],
			},
		});
	}

	private async handleMessage(message: LiveServerMessage) {
		// console.log(JSON.stringify(message));
		const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
		if (audio) {
			this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
			const audioBuffer = await decodeAudioData(decode(audio), this.outputAudioContext, 24000, 1);
			const source = this.outputAudioContext.createBufferSource();
			source.buffer = audioBuffer;
			source.connect(this.outputNode);
			source.onended = () => this.sources.delete(source);
			source.start(this.nextStartTime);
			this.nextStartTime += audioBuffer.duration;
			this.sources.add(source);
		}
		if (message.serverContent?.interrupted) {
			this.stopSources();
		}
	}

	private stopSources() {
		this.sources.forEach(s => s.stop());
		this.sources.clear();
		this.nextStartTime = 0;
	}

	private async startRecording() {
		if (this.isRecording) return;
		try {
			this.session?.sendClientContent({
				turns: [{ role: 'user', parts: [{ text: 'Hola' }] }],
				turnComplete: true,
			});

			this.inputAudioContext.resume();
			this.updateStatus('Requesting microphone access...');

			this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
			this.sourceNode = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
			this.sourceNode.connect(this.inputNode);

			const bufferSize = 256;
			this.scriptProcessorNode = this.inputAudioContext.createScriptProcessor(bufferSize, 1, 1);

			this.scriptProcessorNode.onaudioprocess = e => {
				if (!this.isRecording) return;
				const pcmData = e.inputBuffer.getChannelData(0);
				this.session?.sendRealtimeInput({ media: createBlob(pcmData) });
			};

			this.inputNode.connect(this.scriptProcessorNode);
			this.scriptProcessorNode.connect(this.inputAudioContext.destination);

			this.isRecording = true;
			this.ui.setRecordingState(true);
			this.updateStatus('🔴 Recording...');
		} catch (e) {
			this.handleError(e);
			this.stopRecording();
		}
	}

	private stopRecording() {
		if (!this.isRecording) return;

		this.stopSources();

		this.isRecording = false;
		this.scriptProcessorNode?.disconnect();
		this.sourceNode?.disconnect();

		this.scriptProcessorNode = null;
		this.sourceNode = null;

		this.mediaStream?.getTracks().forEach(track => track.stop());
		this.mediaStream = null;

		this.ui.setRecordingState(false);
		this.updateStatus('Recording stopped.');
	}

	private reset() {
		this.session?.close();
		this.sources.forEach(s => s.stop());
		this.sources.clear();
		this.nextStartTime = 0;
		this.initSession();
		this.updateStatus('Session reset.');
	}

	private updateStatus(msg: string) {
		this.status = msg;
		this.ui.updateStatus(msg);
	}

	private handleError(e: any) {
		const msg = e?.message || 'Unknown error';
		this.error = msg;
		this.ui.updateStatus(`Error: ${msg}`);
		console.error(e);
	}
}
