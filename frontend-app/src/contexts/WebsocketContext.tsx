import { createContext } from "react";
import { io, Socket } from "socket.io-client";

// TODO: make token getting dynamic so that token is available in backend socket
const token = document.cookie.split("=")[1]; // Maybe clean up later

export const socket = io("http://localhost", {
	path: "/backend/socket.io",
	extraHeaders: {
		Authorization: `Bearer ${token}`,
	},
});

export const WebSocketContext = createContext<Socket>(socket);

export const WebSocketProvider = WebSocketContext.Provider;
