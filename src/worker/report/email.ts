// Email the daily report PDF to every registered user, from the onboarded
// mkuritsu.dev sender. Uses the Workers Email Sending binding.

const FROM = { email: "hackathon-winners@mkuritsu.dev", name: "Hedge Fund of Agents" };

export async function recipientEmails(db: D1Database): Promise<string[]> {
	const rows = await db
		.prepare("SELECT DISTINCT email FROM users WHERE email IS NOT NULL AND email != ''")
		.all<{ email: string }>();
	return rows.results.map((r) => r.email);
}

export async function sendReportEmail(
	env: Env,
	pdf: Uint8Array,
	key: string,
): Promise<{ sent: number; skipped: boolean }> {
	const recipients = await recipientEmails(env.ACCOUNTS_DB);
	if (recipients.length === 0) {
		return { sent: 0, skipped: true };
	}

	const date = key.replace(/^fund-report-|\.pdf$/g, "");
	const html = `<h1>Hedge Fund of Agents</h1>
<p>Your daily desk report for <strong>${date}</strong> is attached.</p>
<p>All trades are simulated.</p>`;
	const text = `Hedge Fund of Agents\n\nYour daily desk report for ${date} is attached.\nAll trades are simulated.`;

	// One message per recipient so addresses are not disclosed to each other.
	let sent = 0;
	for (const to of recipients) {
		await env.EMAIL.send({
			to,
			from: FROM,
			subject: `Daily Desk Report - ${date}`,
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
		sent++;
	}
	return { sent, skipped: false };
}
