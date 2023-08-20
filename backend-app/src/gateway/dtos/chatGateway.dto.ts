import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsAlphanumeric,
  IsInt,
  IsJWT,
  IsNumber,
  IsOptional,
  IsPositive,
  ValidateNested,
} from 'class-validator';
import { createMessageDto } from 'src/chat-messages/dtos/createMessage.dto';
import { updateParticipantDto } from 'src/chat-participants/dtos/updateChatParticipant.dto';
import { createChatDto } from 'src/chats/dtos/createChats.dto';

export class ReceivedInfoDto {
  @ApiProperty()
  @IsJWT()
  token: string;

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
  @IsNumber()
  inviteDate?: number;
}

