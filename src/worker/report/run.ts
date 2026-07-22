// The full daily report job: generate the PDF, store it in R2, and email it to
// every registered user. Shared by the cron (scheduled handler) and the
// /api/report/run endpoint so the button tests exactly what the cron does.

import { generateAndStoreReport } from "./pdf";
import { sendReportEmail } from "./email";

export interface DailyReportResult {
	key: string;
	size: number;
	emailsSent: number;
	emailsFailed: number;
	emailSkipped: boolean;
}

export async function runDailyReport(env: Env): Promise<DailyReportResult> {
	console.log(`[report] runDailyReport called at ${new Date().toISOString()}`);
	const { pdf, key } = await generateAndStoreReport(env);
	const { sent, failed, skipped } = await sendReportEmail(env, pdf, key);
	return {
		key,
		size: pdf.byteLength,
		emailsSent: sent,
		emailsFailed: failed,
		emailSkipped: skipped,
	};
}
