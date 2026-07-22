import { useState } from "react";
import { ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";

// Username-only login. New usernames must supply a valid email (the backend
// uses it for the daily report). Returning usernames log in with just a name.
export default function AuthModal({
	open,
	onClose,
	onSuccess,
}: {
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
}) {
	const { login } = useAuth();
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	if (!open) {
		return null;
	}

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		if (busy) return;
		setBusy(true);
		setError(null);
		try {
			await login(username.trim(), email.trim() || undefined);
			onSuccess();
		} catch (err) {
			// A new username without an email 400s: prompt for it and retry.
			const message =
				err instanceof ApiError ? err.message : "Login failed. Try again.";
			setError(message);
			setBusy(false);
		}
	}

	return (
		<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
			<div className="w-full max-w-md bg-surface-container border-2 border-primary-fixed p-1 noise-bg shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
				<div className="bg-surface-container-lowest border-b-2 border-primary-fixed p-3 flex justify-between items-center">
					<span className="font-label-caps text-[11px] text-primary-fixed tracking-tighter">
						OPERATOR AUTH // SECTOR_07
					</span>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close"
						className="material-symbols-outlined text-on-surface-variant hover:text-primary-fixed text-[18px]"
					>
						close
					</button>
				</div>

				<form onSubmit={submit} className="p-6 flex flex-col gap-5">
					<div>
						<h2 className="font-headline-lg text-headline-lg text-primary-fixed uppercase led-text leading-none">
							IDENTIFY YOURSELF
						</h2>
						<p className="font-label-caps text-[10px] text-secondary-fixed-dim mt-2 uppercase tracking-widest">
							Each operator is their own simulated fund
						</p>
					</div>

					<label className="flex flex-col gap-1">
						<span className="font-label-caps text-[10px] text-primary-fixed uppercase tracking-widest">
							Callsign / Username
						</span>
						<input
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="degen_dan"
							autoFocus
							className="bg-surface-container-low border-b-[3px] border-primary-fixed px-3 py-2 text-on-surface font-financial-display text-[20px] focus:outline-none focus:border-secondary"
						/>
					</label>

					<label className="flex flex-col gap-1">
						<span className="font-label-caps text-[10px] text-primary-fixed uppercase tracking-widest">
							Email (new operators only)
						</span>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="you@example.com"
							className="bg-surface-container-low border-b-[3px] border-primary-fixed px-3 py-2 text-on-surface font-body-md focus:outline-none focus:border-secondary"
						/>
						<span className="font-label-caps text-[9px] text-on-surface-variant uppercase">
							Used to email your daily report
						</span>
					</label>

					{error && (
						<div className="border border-error bg-error/10 text-error font-label-caps text-label-caps px-3 py-2">
							{error}
						</div>
					)}

					<button
						type="submit"
						disabled={busy || username.trim().length < 2}
						className="border-2 border-primary-fixed bg-surface text-primary-fixed font-headline-lg text-headline-lg py-3 uppercase hover:bg-primary-fixed hover:text-on-primary-fixed transition-colors active:scale-95 neon-glow-primary disabled:opacity-40 disabled:cursor-not-allowed"
					>
						{busy ? "AUTHORIZING..." : "ENTER THE DESK"}
					</button>
				</form>
			</div>
		</div>
	);
}
