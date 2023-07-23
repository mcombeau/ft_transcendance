import { IsAlpha, IsAlphanumeric, IsBoolean, IsNotEmpty, IsNumber } from 'class-validator';

export class createChatDto {
  @IsNotEmpty()
  @IsAlphanumeric()
  name: string;

  @IsNotEmpty()
  @IsAlphanumeric()
  password: string;

  @IsNotEmpty()
  @IsBoolean()
  private: boolean;

  @IsNotEmpty()
  @IsAlphanumeric()
  owner: string;
}

