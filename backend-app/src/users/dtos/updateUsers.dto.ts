import { ApiProperty } from '@nestjs/swagger';
import { IsAlphanumeric, IsOptional, IsString, Length } from 'class-validator';

export class updateUsersDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  @IsAlphanumeric()
  @Length(3, 15)
  username?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @IsAlphanumeric()
  @Length(10, 20)
  password?: string;

  @ApiProperty()
  @IsOptional()
  @IsAlphanumeric()
  email?: string;
}
