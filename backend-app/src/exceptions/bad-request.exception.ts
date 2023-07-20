import { BadRequestException } from "@nestjs/common";

export class ChatCreationException extends BadRequestException {
    constructor(message: string) {
        super(`Could not create chat: ${message}`);
    }
}

export class ParticipantAlreadyInChatRoomException extends BadRequestException {
    constructor(user: string, chatRoom: string) {
        super(`User '${user}' is already in chat room '${chatRoom}`);
    }
}