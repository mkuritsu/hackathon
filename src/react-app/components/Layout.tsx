import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

export default function Layout() {
	return (
		<div className="bg-background text-on-surface font-body-md min-h-screen relative overflow-x-hidden">
			{/* CRT scanlines overlay */}
			<div className="scanlines fixed inset-0 z-50 mix-blend-overlay" />

			<Header />

			{/* pt clears the top ticker (32px) + nav bar (64px); pb clears the footer ticker */}
			<main className="pt-28 pb-16 relative z-10">
				<Outlet />
			</main>

			<Footer />
		</div>
	);
}
