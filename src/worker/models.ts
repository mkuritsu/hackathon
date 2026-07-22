// Centralized model registry, backed by the MODELS KV namespace. Model ids are
// declared once (KV key "models") and read everywhere, so swapping a model is a
// config change, not a code change. Falls back to in-code defaults if KV is
// empty or the binding is missing, so nothing breaks locally.

export type ModelRole = "analyst";

export const DEFAULT_MODELS: Record<ModelRole, string> = {
	analyst: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
};

const KV_KEY = "models";

export async function getAllModels(env: Env): Promise<Record<string, string>> {
	let stored: Record<string, string> = {};
	if (env.MODELS) {
		try {
			stored = ((await env.MODELS.get(KV_KEY, "json")) as Record<string, string> | null) ?? {};
		} catch {
			stored = {};
		}
	}
	return { ...DEFAULT_MODELS, ...stored };
}

export async function getModelId(env: Env, role: ModelRole): Promise<string> {
	const all = await getAllModels(env);
	return all[role] ?? DEFAULT_MODELS[role];
}
