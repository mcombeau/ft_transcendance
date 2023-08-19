import { ApiProperty } from '@nestjs/swagger';

export type createChatParams = {
  name: string;
  password: string;
  private: boolean;
  ownerID: number;
};

export type createDMParams = {
  userID1: number;
  userID2: number;
};

export type updateChatParams = {
  name: string;
  password: string;
  private: boolean;
  participantID: number;
};

export type participantUsernames = {
  username: string;
};
