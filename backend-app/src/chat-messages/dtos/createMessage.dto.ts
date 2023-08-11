import { ApiProperty } from '@nestjs/swagger';
import { IsAlphanumeric, IsNotEmpty, IsNumber } from 'class-validator';

export class createMessageDto {
  
  @ApiProperty()
  @IsNotEmpty()
  @IsAlphanumeric()
  message: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsAlphanumeric()
  sender: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsAlphanumeric()
  chatRoom: string;
}
