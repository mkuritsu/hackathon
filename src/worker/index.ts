export default {
	fetch(request): Response {
		const url = new URL(request.url);

		if (request.method === "GET" && url.pathname === "/api/health") {
			return Response.json({
				status: "ok",
				message: "Worker API is online",
				timestamp: new Date().toISOString(),
			});
		}

		return Response.json({ error: "Not found" }, { status: 404 });
	},
} satisfies ExportedHandler<Env>;
