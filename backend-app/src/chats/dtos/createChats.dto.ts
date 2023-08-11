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
  @IsBoolean()
  directMessage: boolean;

  @IsNotEmpty()
  @IsAlphanumeric()
  owner: string;
}

export class createChatDMDto {
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
  @IsBoolean()
  directMessage: boolean;

  @IsNotEmpty()
  @IsAlphanumeric()
  user1: string;

  @IsNotEmpty()
  @IsAlphanumeric()
  user2: string;
}

