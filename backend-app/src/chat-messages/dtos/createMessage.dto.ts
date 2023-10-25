import { ApiProperty } from '@nestjs/swagger';
import {
  IsAlphanumeric,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  MinLength,
} from 'class-validator';

export class createMessageDto {
  @ApiProperty()
  @IsNotEmpty()
  @MinLength(1)
  message: string;

  @ApiProperty()
  @IsOptional()
  @IsNotEmpty()
  @IsInt()
  senderID: number;

  @ApiProperty()
  @IsOptional()
  @IsNotEmpty()
  @IsInt()
  chatRoomID: number;

  @ApiProperty()
  @IsOptional()
  sentAt: Date;
}
