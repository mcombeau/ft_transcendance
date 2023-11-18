import { BadRequestException } from "@nestjs/common";

export class ChatCreationException extends BadRequestException {
	constructor(message: string) {
		super(`Could not create chat: ${message}`);
	}
}

export class InviteCreationException extends BadRequestException {
	constructor(message: string) {
		super(`Could not invite user: ${message}`);
	}
}

export class InvalidNameException extends BadRequestException {
	constructor(message: string) {
		super(`Invalid name: ${message}`);
	}
}

export class InvalidPasswordException extends BadRequestException {
	constructor(message: string) {
		super(`Invalid password: ${message}`);
	}
}

export class ParticipantAlreadyInChatRoomException extends BadRequestException {
	constructor(user: string, chatRoom: string) {
		super(`User '${user}' is already in chat room '${chatRoom}`);
	}
}

export class ChatFetchError extends BadRequestException {
	constructor(message: string) {
		super(`Could not fetch chat: ${message}`);
	}
}
