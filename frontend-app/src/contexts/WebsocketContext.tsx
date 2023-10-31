import { createContext } from "react";
import { io, Socket } from "socket.io-client";

const URL = "http://localhost:3001";

const token = document.cookie.split("=")[1]; // Maybe clean up later

export const socket = io(URL, {
  extraHeaders: {
    Authorization: `Bearer ${token}`,
  },
});
export const WebSocketContext = createContext<Socket>(socket);
