import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
	IsAlphanumeric,
	IsInt,
	IsNumber,
	IsOptional,
	IsPositive,
	ValidateNested,
} from "class-validator";
import { createMessageDto } from "src/chat-messages/dtos/createMessage.dto";
import { updateParticipantDto } from "src/chat-participants/dtos/updateChatParticipant.dto";
import { createChatDto } from "src/chats/dtos/createChats.dto";
import { sendInviteDto } from "src/invites/dtos/sendInvite.dto";

export class ReceivedInfoDto {
	@ApiProperty()
	@IsOptional()
	@IsInt()
	@IsPositive()
	userID?: number;

	@ApiProperty()
	@IsOptional()
	@IsAlphanumeric()
	username?: string;

	@ApiProperty()
	@IsOptional()
	@IsAlphanumeric()
	username2?: string;

	@ApiProperty()
	@IsOptional()
	@IsInt()
	@IsPositive()
	targetID?: number;

	@ApiProperty()
	@IsOptional()
	@IsInt()
	@IsPositive()
	chatRoomID?: number;

	@ApiProperty()
	@IsOptional()
	@ValidateNested()
	@Type(() => createMessageDto)
	messageInfo?: createMessageDto;

	@ApiProperty()
	@IsOptional()
	@ValidateNested()
	@Type(() => createChatDto)
	chatInfo?: createChatDto;

	@ApiProperty()
	@IsOptional()
	@ValidateNested()
	@Type(() => updateParticipantDto)
	participantInfo?: updateParticipantDto;

	@ApiProperty()
	@IsOptional()
	@ValidateNested()
	@Type(() => sendInviteDto)
	inviteInfo?: sendInviteDto;

	@ApiProperty()
	@IsOptional()
	@IsNumber()
	inviteDate?: number;
}
