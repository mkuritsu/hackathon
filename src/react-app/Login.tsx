import { useState } from "react";

type LoginProps = {
	initialUsername: string;
	onLoggedIn: (username: string) => void;
};

export default function Login({ initialUsername, onLoggedIn }: LoginProps) {
	const [username, setUsername] = useState(initialUsername);
	const [email, setEmail] = useState("");
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function submit(event: React.FormEvent) {
		event.preventDefault();
		setError("");
		setIsSubmitting(true);

		try {
			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username: username.trim(), email: email.trim() }),
			});
			const data = (await response.json()) as {
				user?: { username: string };
				error?: string;
			};

			if (!response.ok || !data.user) {
				throw new Error(data.error ?? `Login failed (${response.status})`);
			}

			onLoggedIn(data.user.username);
		} catch (loginError) {
			setError(loginError instanceof Error ? loginError.message : "Login failed");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<main className="auth">
			<form className="auth-card" onSubmit={submit}>
				<p className="eyebrow">Hedge Fund of Agents</p>
				<h1>Sign in</h1>
				<p className="intro">
					Enter a username to access the desk. No password needed. New here? Add an
					email and we&apos;ll send you the daily report.
				</p>

				<label htmlFor="username">Username</label>
				<input
					id="username"
					name="username"
					autoFocus
					autoComplete="username"
					placeholder="trader_joe"
					value={username}
					onChange={(event) => setUsername(event.target.value)}
				/>

				<label htmlFor="email">Email (new users)</label>
				<input
					id="email"
					name="email"
					type="email"
					autoComplete="email"
					placeholder="you@example.com"
					value={email}
					onChange={(event) => setEmail(event.target.value)}
				/>

				<button type="submit" disabled={isSubmitting || username.trim().length < 2}>
					{isSubmitting ? "Signing in..." : "Continue"}
				</button>

				{error && <strong className="error">{error}</strong>}
			</form>
		</main>
	);
}
