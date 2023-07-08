import { createContext } from "react";
import {io, Socket} from 'socket.io-client';

const URL = 'http://localhost:3001';

export const socket = io(URL);
export const WebSocketContext = createContext<Socket>(socket);

export const WebSocketProvider = WebSocketContext.Provider;
