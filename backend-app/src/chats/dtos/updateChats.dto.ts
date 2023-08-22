import { ApiProperty } from '@nestjs/swagger';
import {
  IsAlphanumeric,
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
  Length,
} from 'class-validator';

// TODO [mcombeau]: increase password minimum length after testing

export class updateChatDto {
  @ApiProperty()
  @IsOptional()
  @IsAlphanumeric()
  @Length(3, 20)
  name?: string;

  @ApiProperty()
  @IsOptional()
  @IsAlphanumeric()
  @Length(3, 20)
  password?: string;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiProperty()
  @IsOptional()
  @IsInt()
  @IsPositive()
  participantID?: number;
}

