import { ApiProperty } from '@nestjs/swagger';
import { IsAlphanumeric, IsOptional } from 'class-validator';

export class updateUsersDto {
  @ApiProperty()
  @IsOptional()
  @IsAlphanumeric()
  username: string;

  @ApiProperty()
  @IsOptional()
  @IsAlphanumeric()
  login42: string;

  @ApiProperty()
  @IsOptional()
  @IsAlphanumeric()
  password: string;

  @ApiProperty()
  @IsOptional()
  @IsAlphanumeric()
  email: string;
}
