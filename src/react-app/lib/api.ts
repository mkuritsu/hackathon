// Thin typed client for the worker JSON API. All calls are same-origin (the
// worker serves both the API and these assets), so the session cookie rides
// along automatically.

export type User = { id: number; username: string; email: string | null };

export type Trade = {
	ts: string;
	adapter: string;
	instrument: string;
	action: "buy" | "sell";
	qty: number;
	price: number;
	thesis: string;
	confidence: number;
};

export type Position = {
	adapter: string;
	instrument: string;
	qty: number;
	avg_price: number;
	opened_at: string;
};

export type Portfolio = {
	cash: number;
	startingCash: number;
	positionsValue: number;
	nav: number;
	positions: Position[];
	trades: Trade[];
};

export type WorkflowStatus = { status: string; output?: unknown; error?: unknown };
export type ResearchRun = { id: string; cycleId: string; status: WorkflowStatus };

export class ApiError extends Error {
	constructor(
		public status: number,
		message: string,
	) {
		super(message);
	}
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(path, {
		credentials: "same-origin",
		headers: init?.body ? { "Content-Type": "application/json" } : undefined,
		...init,
	});
	const text = await res.text();
	let data: unknown;
	try {
		data = text ? JSON.parse(text) : null;
	} catch {
		data = text;
	}
	if (!res.ok) {
		const message =
			(data && typeof data === "object" && "error" in data
				? String((data as { error: unknown }).error)
				: null) ?? `Request failed (${res.status})`;
		throw new ApiError(res.status, message);
	}
	return data as T;
}

export const getMe = () => api<{ user: User }>("/api/auth/me");

export const login = (username: string, email?: string) =>
	api<{ user: User }>("/api/auth/login", {
		method: "POST",
		body: JSON.stringify(email ? { username, email } : { username }),
	});

export const logout = () => api<{ ok: boolean }>("/api/auth/logout", { method: "POST" });

export const getPortfolio = () => api<Portfolio>("/api/portfolio");

export const runResearch = () =>
	api<ResearchRun>("/api/research/run", { method: "POST", body: "{}" });

export const getResearch = (id: string) =>
	api<{ id: string; status: WorkflowStatus }>(`/api/research/${id}`);

export const emailReport = () =>
	api<{ ok: boolean; emailed: string; key: string }>("/api/report/email", {
		method: "POST",
		body: "{}",
	});
