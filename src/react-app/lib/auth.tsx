import {
	createContext,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";
import * as api from "./api";

type AuthContextValue = {
	user: api.User | null;
	loading: boolean;
	login: (username: string, email?: string) => Promise<void>;
	logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<api.User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		api
			.getMe()
			.then((r) => setUser(r.user))
			.catch(() => setUser(null))
			.finally(() => setLoading(false));
	}, []);

	async function login(username: string, email?: string) {
		const r = await api.login(username, email);
		setUser(r.user);
	}

	async function logout() {
		await api.logout().catch(() => {});
		setUser(null);
	}

	return (
		<AuthContext.Provider value={{ user, loading, login, logout }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth(): AuthContextValue {
	const value = useContext(AuthContext);
	if (!value) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return value;
}
