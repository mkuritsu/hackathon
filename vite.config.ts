import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react(), cloudflare()],
	server: {
		// Don't reload the page when the worker writes runtime files (e.g. the
		// local email simulator drops files under .wrangler/tmp). A reload here
		// aborts in-flight fetches like the dev "run report" button.
		watch: {
			ignored: ["**/.wrangler/**", "**/dist/**"],
		},
	},
});
