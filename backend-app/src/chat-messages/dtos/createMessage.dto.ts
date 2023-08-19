import { ApiProperty } from '@nestjs/swagger';
import { IsAlphanumeric, IsDate, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, MinLength } from 'class-validator';

export class createMessageDto {
  
  @ApiProperty()
  @IsNotEmpty()
  @IsAlphanumeric()
  @MinLength(1)
  message: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  senderID: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  chatRoomID: number;

  @ApiProperty()
  @IsOptional()
  @IsDate()
  sentAt: Date;
}
