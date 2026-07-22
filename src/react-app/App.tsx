import { useState } from "react";

type ApiStatus = {
	message: string;
	status: "ok";
	timestamp: string;
};

export default function App() {
	const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	async function checkApi() {
		setIsLoading(true);
		setError("");

		try {
			const response = await fetch("/api/health");

			if (!response.ok) {
				throw new Error(`API returned ${response.status}`);
			}

			setApiStatus((await response.json()) as ApiStatus);
		} catch (requestError) {
			setApiStatus(null);
			setError(
				requestError instanceof Error ? requestError.message : "Request failed",
			);
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<main>
			<section className="hero">
				<p className="eyebrow">Cloudflare Workers + React</p>
				<h1>One project, edge to interface.</h1>
				<p className="intro">
					The frontend is built with React and Vite. The API runs in the
					Cloudflare Workers runtime and ships with the same deployment.
				</p>

				<div className="actions">
					<button type="button" onClick={checkApi} disabled={isLoading}>
						{isLoading ? "Checking..." : "Check Worker API"}
					</button>
					<a
						href="https://developers.cloudflare.com/workers/"
						target="_blank"
						rel="noreferrer"
					>
						Workers docs
					</a>
				</div>

				<div className="result" aria-live="polite">
					{apiStatus && (
						<>
							<span className="status-dot" />
							<div>
								<strong>{apiStatus.message}</strong>
								<time dateTime={apiStatus.timestamp}>
									{new Date(apiStatus.timestamp).toLocaleString()}
								</time>
							</div>
						</>
					)}
					{error && <strong className="error">{error}</strong>}
					{!apiStatus && !error && "The API is ready for a health check."}
				</div>
			</section>

			<aside>
				<span>Project structure</span>
				<code>src/react-app</code>
				<p>React frontend</p>
				<code>src/worker</code>
				<p>Worker backend</p>
				<code>wrangler.jsonc</code>
				<p>Cloudflare configuration</p>
			</aside>
		</main>
	);
}
