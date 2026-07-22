import { useEffect, useState } from "react";
import Login from "./Login";

const USERNAME_KEY = "hfoa.username";

type AuthState =
	| { status: "loading" }
	| { status: "anonymous" }
	| { status: "authenticated"; username: string };

export default function App() {
	const [auth, setAuth] = useState<AuthState>({ status: "loading" });

	useEffect(() => {
		let active = true;

		(async () => {
			try {
				const response = await fetch("/api/auth/me");
				if (active && response.ok) {
					const data = (await response.json()) as { user: { username: string } };
					localStorage.setItem(USERNAME_KEY, data.user.username);
					setAuth({ status: "authenticated", username: data.user.username });
					return;
				}
			} catch {
				// fall through to anonymous
			}
			if (active) {
				setAuth({ status: "anonymous" });
			}
		})();

		return () => {
			active = false;
		};
	}, []);

	function handleLoggedIn(username: string) {
		localStorage.setItem(USERNAME_KEY, username);
		setAuth({ status: "authenticated", username });
	}

	async function handleLogout() {
		await fetch("/api/auth/logout", { method: "POST" });
		setAuth({ status: "anonymous" });
	}

	if (auth.status === "loading") {
		return <main className="auth" aria-busy="true" />;
	}

	if (auth.status === "anonymous") {
		return (
			<Login
				initialUsername={localStorage.getItem(USERNAME_KEY) ?? ""}
				onLoggedIn={handleLoggedIn}
			/>
		);
	}

	return (
		<main>
			<section className="hero">
				<p className="eyebrow">Hedge Fund of Agents</p>
				<h1>Welcome, {auth.username}.</h1>
				<p className="intro">
					You are signed in to the trading desk. The autonomous fund runs on
					Cloudflare and all trades are simulated.
				</p>

				<div className="actions">
					<a href="/api/report/preview" target="_blank" rel="noreferrer">
						View report preview
					</a>
					<button type="button" onClick={handleLogout}>
						Sign out
					</button>
				</div>
			</section>

			<aside>
				<span>Signed in as</span>
				<code>{auth.username}</code>
				<p>Session stored in an HttpOnly cookie</p>
			</aside>
		</main>
	);
}
