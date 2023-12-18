import {
	forwardRef,
	Inject,
	Logger,
	OnModuleInit,
	UseFilters,
	UsePipes,
	ValidationPipe,
} from "@nestjs/common";
import {
	ConnectedSocket,
	MessageBody,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { AuthService, JwtToken } from "src/auth/auth.service";
import { ChatPermissionError } from "src/exceptions/bad-request.interceptor";
import { WebsocketExceptionsFilter } from "src/exceptions/websocket-exception.filter";
import { userStatus } from "src/users/entities/user.entity";
import { UsersService } from "src/users/users.service";
import { ChatGateway } from "./chat.gateway";

@WebSocketGateway({
	cors: {
		origin: [
			"http://localhost:3000",
			"http://localhost",
			process.env.FT_TRANSCENDANCE_DOMAIN,
		],
	},
})
@UseFilters(WebsocketExceptionsFilter)
@UsePipes(new ValidationPipe({ whitelist: true }))
export class SocketGateway implements OnModuleInit {
	constructor(
		@Inject(forwardRef(() => UsersService))
		private userService: UsersService,
		@Inject(forwardRef(() => AuthService))
		private authService: AuthService,
		@Inject(forwardRef(() => ChatGateway))
		private chatGateway: ChatGateway
	) {}
	@WebSocketServer()
	server: Server;

	private readonly logger: Logger = new Logger("Socket Gateway");

	onModuleInit(): void {
		this.server.on("connection", async (socket) => {
			try {
				const token = socket.handshake.headers.authorization.split(" ")[1];
				const tokenInfo: JwtToken = await this.authService.validateToken(token);

				if (tokenInfo === null) return;

				const user = await this.userService.fetchUserByID(tokenInfo.userID);

				this.logger.log(
					`[Connection event]: A user connected: ${tokenInfo.username} - ${tokenInfo.userID} (${socket.id})`
				);
				this.onLogin(socket, token);
				socket.on("disconnect", () => {
					this.logger.log(
						`[Disconnection event]: A user disconnected: ${tokenInfo.username} - ${tokenInfo.userID} (${socket.id})`
					);
					this.onLogout(socket, token);
				});

				if (tokenInfo && user) {
					await this.chatGateway.joinSocketRooms(socket, user.id);
				}
			} catch (e) {
				this.logger.warn(
					`[Connection event]: Forcing logout: unauthorized connection: ${e.message}`
				);
				socket.emit("logout");
				return;
			}
		});
	}

	// -------------------- EVENTS
	// TODO: GET TOKEN FROM SOCKET NOT FROM PASSED TOKEN!!!
	async checkIdentity(token: string, socket: Socket): Promise<number> {
		try {
			const socketToken = socket.handshake.headers.authorization.split(" ")[1];
			if (token !== socketToken) {
				// TODO: why is socketToken sometimes undefined ? Investigate.
				this.logger.warn(
					"[Check Identity]: Socket token and token DON'T MATCH!"
				);
			}
			if (socketToken === "undefined") {
				this.logger.warn("[Check Identity]: Socket token is undefined");
				// throw new ChatPermissionError('socket token is undefined');
			}
			const tokenInfo: JwtToken = await this.authService.validateToken(token);
			if (tokenInfo === null) {
				throw new ChatPermissionError("no token to identify user!");
			}
			return tokenInfo.userID;
		} catch (e) {
			this.logger.warn(`[Check Identity]: unauthorized: ${e.message}`);
			throw new ChatPermissionError("no token to identify user!");
		}
	}

	@SubscribeMessage("login")
	async onLogin(
		@ConnectedSocket() socket: Socket,
		@MessageBody() token: string
	): Promise<void> {
		try {
			const userID = await this.checkIdentity(token, socket);
			socket.data.userID = userID;

			await this.userService.updateUserByID(userID, {
				status: userStatus.ONLINE,
			});
			const username = (await this.userService.fetchUserByID(userID)).username;
			this.logger.log(
				`[Login event]: A user logged in: ${username} - ${userID} (${socket.id})`
			);
			this.server.emit("status change", {
				userID: userID,
				userStatus: userStatus.ONLINE,
			});
		} catch (e) {
			this.logger.warn(`[Login event]: ${e.message}`);
		}
	}

	@SubscribeMessage("logout")
	async onLogout(
		@ConnectedSocket() socket: Socket,
		@MessageBody() token: string
	): Promise<void> {
		try {
			const userID = await this.checkIdentity(token, socket);
			socket.data.userID = userID;

			await this.authService.logout(userID);
			socket.rooms.forEach(async (room: string) => {
				if (room !== socket.id) await socket.leave(room);
			});

			const username = (await this.userService.fetchUserByID(userID)).username;
			this.logger.log(
				`[Logout event]: A user logged out: ${username} - ${userID} (${socket.id})`
			);
			this.server.emit("status change", {
				userID: userID,
				userStatus: userStatus.OFFLINE,
			});
		} catch (e) {
			this.logger.warn(`[Logout event]: ${e.message}`);
		}
	}
}
