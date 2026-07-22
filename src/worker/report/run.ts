// The full daily report job: for every user, generate their own account PDF,
// store it in R2 (keyed by user), and email it to that user. Shared by the cron
// (scheduled handler) and the /api/dev/report/run endpoint so the button tests
// exactly what the cron does.

import { generateAndStoreReport } from "./pdf";
import { sendReportEmail } from "./email";

export interface DailyReportResult {
	users: number;
	reportsGenerated: number;
	emailsSent: number;
	emailsFailed: number;
	emailsSkipped: number;
}

interface ReportUser {
	id: number;
	username: string;
	email: string | null;
}

export async function runDailyReport(env: Env): Promise<DailyReportResult> {
	console.log(`[report] runDailyReport called at ${new Date().toISOString()}`);
	const users = await env.ACCOUNTS_DB.prepare(
		"SELECT id, username, email FROM users ORDER BY id",
	).all<ReportUser>();

	const result: DailyReportResult = {
		users: users.results.length,
		reportsGenerated: 0,
		emailsSent: 0,
		emailsFailed: 0,
		emailsSkipped: 0,
	};

	// Sequential on purpose: Browser Rendering has tight concurrency limits, so
	// render one account's PDF at a time.
	for (const user of users.results) {
		try {
			const { pdf, key } = await generateAndStoreReport(env, {
				id: user.id,
				username: user.username,
			});
			result.reportsGenerated++;

			if (!user.email) {
				result.emailsSkipped++;
				continue;
			}
			const ok = await sendReportEmail(env, user.email, pdf, key);
			if (ok) {
				result.emailsSent++;
			} else {
				result.emailsFailed++;
			}
		} catch (error) {
			console.error(`[report] failed for user ${user.id} (${user.username}):`, error);
			result.emailsFailed++;
		}
	}

	return result;
}
