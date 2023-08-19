import { ApiProperty } from '@nestjs/swagger';

export type createChatParams = {
  name: string;
  ownerID: number;
  password?: string;
  private?: boolean;
};

export type createDMParams = {
  userID1: number;
  userID2: number;
};

export type updateChatParams = {
  name?: string;
  password?: string;
  private?: boolean;
  participantID?: number;
};

export type participantUsernames = {
  username: string;
};
