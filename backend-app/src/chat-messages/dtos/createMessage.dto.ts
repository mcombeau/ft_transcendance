import { ApiProperty } from '@nestjs/swagger';
import { IsAlphanumeric, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class createMessageDto {
  
  @ApiProperty()
  @IsNotEmpty()
  @IsAlphanumeric()
  message: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  senderID: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  chatRoomID: number;

  @ApiProperty()
  @IsOptional()
  sentAt: Date;
}
