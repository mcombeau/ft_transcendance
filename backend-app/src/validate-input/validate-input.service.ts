import { Inject, Injectable, forwardRef } from "@nestjs/common";
import { ChatsService } from "src/chats/chats.service";
import {
	InvalidPasswordError,
	InvalidNameError,
} from "src/exceptions/bad-request.interceptor";
import { UsersService } from "src/users/users.service";

@Injectable()
export class ValidateInputService {
	constructor(
		@Inject(forwardRef(() => UsersService))
		private userService: UsersService,
		@Inject(forwardRef(() => ChatsService))
		private chatService: ChatsService
	) {}

	private checkIfContainsOnlyPatternCharacters(
		string: string,
		pattern: RegExp
	) {
		return pattern.test(string);
	}

	private checkMinMaxLength(
		string: string,
		minLength: number,
		maxLength: number
	) {
		return string.length >= minLength && string.length <= maxLength;
	}

	private validateNameString(name: string) {
		if (!this.checkMinMaxLength(name, 3, 15)) {
			throw new InvalidNameError(
				"name must be between 3 and 15 characters long"
			);
		}
		if (!this.checkIfContainsOnlyPatternCharacters(name, /^[A-Za-z0-9\-_]*$/)) {
			throw new InvalidNameError("name contains invalid characters");
		}
	}

	async validateChatRoomName(name: string) {
		this.validateNameString(name);
		const chatRoom = await this.chatService.fetchChatByName(name);
		if (chatRoom) {
			throw new InvalidNameError(`chat by name '${name}' already exists`);
		}
	}

	async validateUsername(username: string) {
		this.validateNameString(username);
		const user = await this.userService.fetchUserByUsername(username);
		if (user) throw new InvalidNameError(`user ${username} already exists`);
	}

	async validatePassword(password: string) {
		if (!this.checkMinMaxLength(password, 3, 15)) {
			throw new InvalidPasswordError(
				"password must be between 3 and 15 characters long"
			);
		}
		if (
			!this.checkIfContainsOnlyPatternCharacters(
				password,
				/^[A-Za-z0-9\-_&$#@!%]*$/
			)
		) {
			throw new InvalidPasswordError("password contains invalid characters");
		}
	}
}
