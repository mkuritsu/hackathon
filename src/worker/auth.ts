// Username-only authentication. No passwords: logging in with a username
// creates the user if needed and issues a session stored in an HttpOnly cookie.

import { Hono } from "hono";
import type { Context, MiddlewareHandler } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { ensureAccount } from "./account";

const SESSION_TTL_DAYS = 30;
const SESSION_TTL_SECONDS = SESSION_TTL_DAYS * 86_400;
const COOKIE_NAME = "session";

type AppEnv = { Bindings: Env };

export interface User {
	id: number;
	username: string;
	email: string | null;
	created_at: string;
	last_login_at: string | null;
}

function normalizeUsername(raw: unknown): string | null {
	if (typeof raw !== "string") {
		return null;
	}
	const username = raw.trim();
	if (username.length < 2 || username.length > 32) {
		return null;
	}
	if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
		return null;
	}
	return username;
}

function normalizeEmail(raw: unknown): string | null {
	if (typeof raw !== "string") {
		return null;
	}
	const email = raw.trim().toLowerCase();
	if (email.length < 3 || email.length > 254) {
		return null;
	}
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return null;
	}
	return email;
}

function cookieOptions(c: Context<AppEnv>) {
	return {
		path: "/",
		httpOnly: true,
		sameSite: "Lax",
		secure: new URL(c.req.url).protocol === "https:",
		maxAge: SESSION_TTL_SECONDS,
	} as const;
}

function requestToken(c: Context<AppEnv>): string {
	const cookie = getCookie(c, COOKIE_NAME);
	if (cookie) {
		return cookie;
	}
	const header = c.req.header("Authorization") ?? "";
	return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

// Resolve the authenticated user for a request, or null if there is no valid
// session. Shared by any route that scopes data to the logged-in user.
export function currentUser(c: Context<AppEnv>): Promise<User | null> {
	return findSessionUser(requestToken(c), c.env.ACCOUNTS_DB);
}

async function findSessionUser(token: string, db: D1Database): Promise<User | null> {
	if (!token) {
		return null;
	}
	return db
		.prepare(
			`SELECT u.id, u.username, u.email, u.created_at, u.last_login_at
			 FROM sessions s JOIN users u ON u.id = s.user_id
			 WHERE s.token = ? AND s.expires_at > datetime('now')`,
		)
		.bind(token)
		.first<User>();
}

export const authApp = new Hono<AppEnv>();

authApp.post("/login", async (c) => {
	const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
	const username = normalizeUsername(body.username);
	if (!username) {
		return c.json({ error: "Invalid username. Use 2-32 chars: letters, numbers, . _ -" }, 400);
	}
	const db = c.env.ACCOUNTS_DB;

	const existing = await db
		.prepare("SELECT id, username, email, created_at, last_login_at FROM users WHERE username = ?")
		.bind(username)
		.first<User>();

	// Login is username-only for returning users. New users must register with a
	// valid email so we can send them the daily report.
	if (existing) {
		await db
			.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?")
			.bind(existing.id)
			.run();
	} else {
		const email = normalizeEmail(body.email);
		if (!email) {
			return c.json({ error: "A valid email is required to register a new username." }, 400);
		}
		await db
			.prepare("INSERT INTO users (username, email) VALUES (?, ?)")
			.bind(username, email)
			.run();
	}

	const user = await db
		.prepare("SELECT id, username, email, created_at, last_login_at FROM users WHERE username = ?")
		.bind(username)
		.first<User>();
	if (!user) {
		return c.json({ error: "Failed to create session" }, 500);
	}

	// Every user is their own simulated fund: make sure an account (with the
	// default starting capital) exists before they can trade.
	await ensureAccount(db, user.id);

	const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
	const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
	await db
		.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)")
		.bind(token, user.id, expiresAt)
		.run();

	setCookie(c, COOKIE_NAME, token, cookieOptions(c));
	return c.json({ user, expires_at: expiresAt });
});

authApp.get("/me", async (c) => {
	const user = await findSessionUser(requestToken(c), c.env.ACCOUNTS_DB);
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}
	return c.json({ user });
});

authApp.post("/logout", async (c) => {
	const token = requestToken(c);
	if (token) {
		await c.env.ACCOUNTS_DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
	}
	deleteCookie(c, COOKIE_NAME, { path: "/" });
	return c.json({ ok: true });
});

// Frontend middleware: refresh the session cookie on valid sessions so the
// login persists across visits. Never blocks; gating is handled client-side.
export const sessionCookieMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
	await next();
	const token = getCookie(c, COOKIE_NAME);
	if (!token) {
		return;
	}
	const user = await findSessionUser(token, c.env.ACCOUNTS_DB);
	if (!user) {
		return;
	}
	c.res = new Response(c.res.body, c.res);
	setCookie(c, COOKIE_NAME, token, cookieOptions(c));
};
