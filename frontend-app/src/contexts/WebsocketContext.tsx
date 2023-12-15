import { createContext } from "react";
import { io, Socket } from "socket.io-client";

// TODO: make token getting dynamic so that token is available in backend socket
const token = document.cookie
	.split("; ")
	.find((row) => row.startsWith("token="))
	?.split("=")[1];

export const socket = io(process.env.FT_TRANSCENDANCE_HOST, {
	path: "/backend/socket.io",
	extraHeaders: {
		Authorization: `Bearer ${token}`,
	},
});

export const WebSocketContext = createContext<Socket>(socket);

export const WebSocketProvider = WebSocketContext.Provider;
