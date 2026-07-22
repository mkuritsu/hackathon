// Email a user their own daily report PDF, from the onboarded mkuritsu.dev
// sender. Uses the Workers Email Sending binding.

const FROM = { email: "hackathon-winners@mkuritsu.dev", name: "Hedge Fund of Agents" };

// Send one user their own report. Best-effort: a failure must not abort the
// wider report job (the PDF is already stored in R2).
export async function sendReportEmail(
	env: Env,
	to: string,
	pdf: Uint8Array,
	key: string,
): Promise<boolean> {
	const date = key.replace(/^report-\d+-|\.pdf$/g, "");
	const html = `<h1>Hedge Fund of Agents</h1>
<p>Your daily account report for <strong>${date}</strong> is attached.</p>
<p>All trades are simulated.</p>`;
	const text = `Hedge Fund of Agents\n\nYour daily account report for ${date} is attached.\nAll trades are simulated.`;

	try {
		await env.EMAIL.send({
			to,
			from: FROM,
			subject: `Your Daily Account Report - ${date}`,
			html,
			text,
			attachments: [
				{
					content: pdf,
					filename: key,
					type: "application/pdf",
					disposition: "attachment",
				},
			],
		});
		return true;
	} catch (error) {
		console.error(`Failed to email report to ${to}:`, error);
		return false;
	}
}
