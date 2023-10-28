import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
} from 'class-validator';

export class updateFriendDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  userID1: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  userID2: number;
}
