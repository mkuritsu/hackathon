export function formatUSD(n: number): string {
	return n.toLocaleString("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

// Read a positive dollar amount from a URLSearchParams "amount" value,
// falling back to a default when missing/invalid.
export function readAmount(raw: string | null, fallback = 10000): number {
	const parsed = Number(raw);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
