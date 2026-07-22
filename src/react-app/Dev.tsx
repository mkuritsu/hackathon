import { useState } from "react";

type Result =
	| { status: "idle" }
	| { status: "running" }
	| { status: "done"; text: string }
	| { status: "error"; text: string };

export default function Dev({ onBack }: { onBack: () => void }) {
	const [results, setResults] = useState<Record<string, Result>>({});

	function set(key: string, result: Result) {
		setResults((prev) => ({ ...prev, [key]: result }));
	}

	async function run(key: string, path: string, method: "GET" | "POST") {
		set(key, { status: "running" });
		// Never let the button spin forever; abort after 90s.
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 90_000);
		try {
			const response = await fetch(path, { method, signal: controller.signal });
			const text = await response.text();
			let pretty = text;
			try {
				pretty = JSON.stringify(JSON.parse(text), null, 2);
			} catch {
				// not JSON, show raw
			}
			set(key, {
				status: response.ok ? "done" : "error",
				text: `HTTP ${response.status}\n${pretty}`,
			});
		} catch (error) {
			const aborted = error instanceof DOMException && error.name === "AbortError";
			set(key, {
				status: "error",
				text: aborted
					? "Timed out after 90s"
					: error instanceof Error
						? error.message
						: "Request failed",
			});
		} finally {
			clearTimeout(timeout);
		}
	}

	const actions: { key: string; label: string; hint: string; onClick: () => void }[] = [
		{
			key: "run",
			label: "Run daily report (cron)",
			hint: "POST /api/dev/report/run - generate PDF, store in R2, email all users",
			onClick: () => run("run", "/api/dev/report/run", "POST"),
		},
		{
			key: "pdf",
			label: "Generate + store PDF",
			hint: "Opens POST /api/report/pdf output (stored in R2, not emailed)",
			onClick: () => window.open("/api/report/pdf", "_blank"),
		},
		{
			key: "preview",
			label: "Open HTML preview",
			hint: "GET /api/report/preview - no browser time used",
			onClick: () => window.open("/api/report/preview", "_blank"),
		},
		{
			key: "health",
			label: "Health check",
			hint: "GET /api/health",
			onClick: () => run("health", "/api/health", "GET"),
		},
	];

	return (
		<main>
			<section className="hero">
				<p className="eyebrow">Hedge Fund of Agents</p>
				<h1>Dev tools</h1>
				<p className="intro">Manual triggers for testing the pipeline.</p>

				<div className="actions">
					<button type="button" onClick={onBack}>
						Back to desk
					</button>
				</div>

				{actions.map((action) => {
					const result = results[action.key] ?? { status: "idle" };
					return (
						<div className="result" key={action.key} style={{ flexDirection: "column", alignItems: "stretch" }}>
							<div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
								<button
									type="button"
									onClick={action.onClick}
									disabled={result.status === "running"}
								>
									{result.status === "running" ? "Running..." : action.label}
								</button>
								<span style={{ flex: 1 }}>{action.hint}</span>
							</div>
							{(result.status === "done" || result.status === "error") && (
								<pre
									className={result.status === "error" ? "error" : ""}
									style={{ margin: "0.75rem 0 0", whiteSpace: "pre-wrap", overflowX: "auto" }}
								>
									{result.text}
								</pre>
							)}
						</div>
					);
				})}
			</section>
		</main>
	);
}
