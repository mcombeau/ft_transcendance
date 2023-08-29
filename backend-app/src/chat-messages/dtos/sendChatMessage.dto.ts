import { ApiProperty } from '@nestjs/swagger';

export class sendChatMessageDto {
  @ApiProperty()
  messageID: number;

  @ApiProperty()
  message: string;

  @ApiProperty()
  senderID: number;

  @ApiProperty()
  senderUsername: string;

  @ApiProperty()
  chatRoomID: number;

  @ApiProperty()
  sentAt: Date;
}
