type EnvExtended = Env & {
	GEMINI_SECRET_KEY: string;
};

type Runtime = import("@astrojs/cloudflare").Runtime<EnvExtended>;

declare namespace App {
	interface Locals extends Runtime {}
}
