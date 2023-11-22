import { Inject, Injectable, forwardRef, Logger } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { ChatsService } from "src/chats/chats.service";
import { ChatEntity } from "src/chats/entities/chat.entity";
import { UserEntity } from "src/users/entities/user.entity";
import { UsersService } from "src/users/users.service";

@Injectable()
export class PasswordService {
	constructor(
		@Inject(forwardRef(() => UsersService))
		private userService: UsersService,
		@Inject(forwardRef(() => ChatsService))
		private chatService: ChatsService
	) {}

	private readonly logger: Logger = new Logger("Users Service");

	async hashPassword(password: string) {
		if (!password || password === "") {
			this.logger.debug("[Hash Password] No password to hash");
			return password;
		}
		const salt = await bcrypt.genSalt();
		const hash = await bcrypt.hash(password, salt);
		return hash;
	}

	async checkPassword(password: string, user: UserEntity) {
		const hash = await this.userService.getUserPasswordHash(user.id);
		const isMatch = await bcrypt.compare(password, hash);
		this.logger.debug(
			`[Check User Password] Password is match result: ${isMatch}`
		);
		return isMatch;
	}

	async checkPasswordChat(
		password: string,
		chat: ChatEntity
	): Promise<boolean> {
		const hash = await this.chatService.getChatRoomPasswordHash(chat.id);
		if (hash === "" || hash === null || hash === undefined) {
			this.logger.debug(
				`[Check Chat Password] Password is match result: true because no password`
			);
			return true;
		}
		if (password == null || password == undefined) {
			this.logger.debug(
				`[Check Chat Password] Password is match result: false`
			);
			return false;
		}
		const isMatch = await bcrypt.compare(password, hash);
		this.logger.debug(
			`[Check Chat Password] Password is match result: ${isMatch}`
		);
		return isMatch;
	}

	async checkPasswordString(password: string, hash: string) {
		const isMatch = await bcrypt.compare(password, hash);
		return isMatch;
	}
}
