import { createContext, useContext, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { io, Socket } from "socket.io-client";

const WebSocketContext = createContext<Socket | null>(null);

export const useWebSocket = () => {
	return useContext(WebSocketContext);
};

interface WebSocketProviderProps {
	children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
	children,
}) => {
	const [socket, setSocket] = useState<Socket | null>(null);
	const [cookies, ,] = useCookies(["token"]);

	useEffect(() => {
		const initialToken = cookies.token;

		const newSocket = io(process.env.FT_TRANSCENDANCE_HOST, {
			path: "/backend/socket.io",
			extraHeaders: {
				Authorization: `Bearer ${initialToken}`,
			},
		});

		setSocket(newSocket);

		return () => {
			newSocket.disconnect();
		};
	}, []);

	useEffect(() => {
		const token = cookies.token;
		if (socket && token) {
			socket.io.opts.extraHeaders = {
				Authorization: `Bearer ${token}`,
			};
		}
	}, [socket, cookies.token]);

	return (
		<WebSocketContext.Provider value={socket}>
			{children}
		</WebSocketContext.Provider>
	);
};
