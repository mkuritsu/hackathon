import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Allocate from "./pages/Allocate";
import Deploying from "./pages/Deploying";
import Arena from "./pages/Arena";
import Charity from "./pages/Charity";
import Selling from "./pages/Selling";
import Slot from "./pages/Slot";
import Overview from "./pages/Overview";

export default function App() {
	return (
		<Routes>
			<Route element={<Layout />}>
				<Route path="/" element={<Landing />} />
				<Route path="/allocate" element={<Allocate />} />
				<Route path="/deploying" element={<Deploying />} />
				<Route path="/arena" element={<Arena />} />
				<Route path="/charity" element={<Charity />} />
				<Route path="/selling" element={<Selling />} />
				<Route path="/slot" element={<Slot />} />
				<Route path="/overview" element={<Overview />} />
				<Route path="*" element={<Navigate to="/" replace />} />
			</Route>
		</Routes>
	);
}
