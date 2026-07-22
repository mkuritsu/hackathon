import { useState } from "react";

type LoginProps = {
	initialUsername: string;
	onLoggedIn: (username: string) => void;
};

type Mode = "login" | "register";

export default function Login({ initialUsername, onLoggedIn }: LoginProps) {
	const [mode, setMode] = useState<Mode>("login");
	const [username, setUsername] = useState(initialUsername);
	const [email, setEmail] = useState("");
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	function switchMode(next: Mode) {
		setMode(next);
		setError("");
	}

	async function submit(event: React.FormEvent) {
		event.preventDefault();
		setError("");
		setIsSubmitting(true);

		const payload =
			mode === "register"
				? { username: username.trim(), email: email.trim() }
				: { username: username.trim() };

		try {
			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const data = (await response.json()) as {
				user?: { username: string };
				error?: string;
			};

			if (!response.ok || !data.user) {
				if (mode === "login" && data.error?.includes("register")) {
					throw new Error("Username not found. Switch to Register to create an account.");
				}
				throw new Error(data.error ?? `Request failed (${response.status})`);
			}

			onLoggedIn(data.user.username);
		} catch (submitError) {
			setError(submitError instanceof Error ? submitError.message : "Request failed");
		} finally {
			setIsSubmitting(false);
		}
	}

	const registering = mode === "register";
	const disabled =
		isSubmitting ||
		username.trim().length < 2 ||
		(registering && email.trim().length < 3);

	return (
		<main className="auth">
			<form className="auth-card" onSubmit={submit}>
				<p className="eyebrow">Hedge Fund of Agents</p>

				<div className="tabs" role="tablist" aria-label="Authentication">
					<button
						type="button"
						role="tab"
						aria-selected={!registering}
						className={`tab ${!registering ? "active" : ""}`}
						onClick={() => switchMode("login")}
					>
						Login
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={registering}
						className={`tab ${registering ? "active" : ""}`}
						onClick={() => switchMode("register")}
					>
						Register
					</button>
				</div>

				<p className="intro">
					{registering
						? "Pick a username and add an email. We'll send you the daily report."
						: "Enter your username to access the desk. No password needed."}
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

				{registering && (
					<>
						<label htmlFor="email">Email</label>
						<input
							id="email"
							name="email"
							type="email"
							autoComplete="email"
							placeholder="you@example.com"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
						/>
					</>
				)}

				<button type="submit" disabled={disabled}>
					{isSubmitting
						? registering
							? "Creating account..."
							: "Signing in..."
						: registering
							? "Create account"
							: "Continue"}
				</button>

				{error && <strong className="error">{error}</strong>}
			</form>
		</main>
	);
}
