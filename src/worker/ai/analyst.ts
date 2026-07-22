import { ANALYST_SYSTEM_PROMPT, buildAnalystUserPrompt } from "./prompts";
import type { MarketContext } from "../adapters/types";
import type { Action, Pitch, PortfolioContext } from "../contracts";

const PITCH_JSON_SCHEMA = {
	type: "object",
	properties: {
		action: { type: "string", enum: ["buy", "sell", "hold"] },
		confidence: { type: "number" },
		thesis: { type: "string" },
	},
	required: ["action", "confidence", "thesis"],
};

const ACTIONS: readonly Action[] = ["buy", "sell", "hold"];

function holdPitch(adapter: string, instrument: string, thesis: string): Pitch {
	return { adapter, instrument, action: "hold", confidence: 0, thesis };
}

// Coerce whatever the model returned into a valid Pitch. Never throws.
function normalizePitch(adapter: string, instrument: string, raw: unknown): Pitch {
	let obj: Record<string, unknown> | null = null;
	if (typeof raw === "string") {
		try {
			obj = JSON.parse(raw) as Record<string, unknown>;
		} catch {
			obj = null;
		}
	} else if (raw && typeof raw === "object") {
		obj = raw as Record<string, unknown>;
	}
	if (!obj) {
		return holdPitch(adapter, instrument, "Unparseable analyst output; defaulting to hold.");
	}

	const action = ACTIONS.includes(obj.action as Action) ? (obj.action as Action) : "hold";
	const rawConf = typeof obj.confidence === "number" ? obj.confidence : Number(obj.confidence);
	const confidence = Number.isFinite(rawConf) ? Math.min(1, Math.max(0, rawConf)) : 0;
	const thesis =
		typeof obj.thesis === "string" && obj.thesis.trim().length > 0
			? obj.thesis.trim().slice(0, 400)
			: "No thesis provided.";

	return { adapter, instrument, action, confidence, thesis };
}

// Loose shape for the AI binding call: the generated Ai type does not include
// response_format, so we adapt through a narrow interface.
type AiRunner = { run(model: string, input: unknown): Promise<unknown> };

export async function runAnalyst(
	ai: Ai,
	modelId: string,
	adapter: string,
	ctx: MarketContext,
	portfolio: PortfolioContext,
): Promise<Pitch> {
	try {
		const res = await (ai as unknown as AiRunner).run(modelId, {
			messages: [
				{ role: "system", content: ANALYST_SYSTEM_PROMPT },
				{ role: "user", content: buildAnalystUserPrompt(ctx, portfolio) },
			],
			response_format: { type: "json_schema", json_schema: PITCH_JSON_SCHEMA },
			temperature: 0.3,
		});
		const payload = (res as { response?: unknown })?.response ?? res;
		return normalizePitch(adapter, ctx.instrument, payload);
	} catch (err) {
		return holdPitch(adapter, ctx.instrument, `Analyst error (${String(err)}); defaulting to hold.`);
	}
}
