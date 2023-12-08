import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	ParseIntPipe,
	Post,
	UseGuards,
} from "@nestjs/common";
import { ChatMessagesService } from "./chat-messages.service";
import { createMessageDto } from "./dtos/createMessage.dto";
import { ChatMessageNotFoundException } from "src/exceptions/not-found.exception";
import {
	ApiBadRequestResponse,
	ApiCreatedResponse,
	ApiOkResponse,
	ApiTags,
	ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { ChatMessageEntity } from "./entities/chat-message.entity";
import { DeleteResult } from "typeorm";
import { sendChatMessageDto } from "./dtos/sendChatMessage.dto";
import { JwtFullAuthGuard } from "src/auth/guards/jwt-full-auth.guard";

// TODO: remove unecessary controller
@UseGuards(JwtFullAuthGuard)
@ApiTags("chat messages")
@Controller("chat-messages")
export class ChatMessagesController {
	constructor(private readonly chatMessageService: ChatMessagesService) {}

	@Get(":id")
	@ApiOkResponse({
		type: sendChatMessageDto,
		description: "Get chat message by ID.",
	})
	async getMessageByID(
		@Param("id", ParseIntPipe) id: number
	): Promise<sendChatMessageDto> {
		const message = await this.chatMessageService.fetchMessage(id);
		if (!message) throw new ChatMessageNotFoundException(id.toString());
		return message;
	}

	@Get()
	@ApiOkResponse({
		type: sendChatMessageDto,
		isArray: true,
		description: "Get all chat messages.",
	})
	getAllMessages(): Promise<sendChatMessageDto[]> {
		return this.chatMessageService.fetchMessages();
	}

	@Post()
	@ApiCreatedResponse({
		type: ChatMessageEntity,
		description: "Record created.",
	})
	@ApiBadRequestResponse({ description: "Bad request." })
	@ApiUnprocessableEntityResponse({
		description: "Database error. (Unprocessable entity)",
	})
	createChatMessage(
		@Body() messageDto: createMessageDto
	): Promise<ChatMessageEntity> {
		return this.chatMessageService.createMessage(messageDto);
	}

	@Delete(":id")
	@ApiOkResponse({ description: "Record deleted by ID." })
	@ApiBadRequestResponse({ description: "Bad request" })
	@ApiUnprocessableEntityResponse({
		description: "Database error. (Unprocessable entity)",
	})
	async deleteMessageByID(
		@Param("id", ParseIntPipe) id: number
	): Promise<DeleteResult> {
		return this.chatMessageService.deleteMessage(id);
	}
}
