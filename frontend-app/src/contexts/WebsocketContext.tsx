import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const WebSocketContext = createContext<Socket | null>(null);

export const useWebSocket = () => {
	const socket = useContext(WebSocketContext);

	// if (!socket) {
	// 	throw new Error("useWebSocket must be used within a WebSocketProvider");
	// }
	return socket;
};

interface WebSocketProviderProps {
	children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
	children,
}) => {
	const [socket, setSocket] = useState<Socket | null>(null);

	useEffect(() => {
		const initialToken = document.cookie
			.split("; ")
			.find((row) => row.startsWith("token="))
			?.split("=")[1];

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
		console.log("WebSocketProvider - Socket:", socket);
	}, [socket]);

	const updateToken = (newToken: string) => {
		if (socket) {
			socket.io.opts.extraHeaders.Authorization = `Bearer ${newToken}`;
		}
	};

	return (
		<WebSocketContext.Provider value={socket}>
			{children}
		</WebSocketContext.Provider>
	);
};

// // TODO: make token getting dynamic so that token is available in backend socket
// const token = document.cookie
// 	.split("; ")
// 	.find((row) => row.startsWith("token="))
// 	?.split("=")[1];

// export const socket = io(process.env.FT_TRANSCENDANCE_HOST, {
// 	path: "/backend/socket.io",
// 	extraHeaders: {
// 		Authorization: `Bearer ${token}`,
// 	},
// });

// export const WebSocketContext = createContext<Socket>(socket);

// export const WebSocketProvider = WebSocketContext.Provider;
