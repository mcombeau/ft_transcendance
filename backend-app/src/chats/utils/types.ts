import { ApiProperty } from '@nestjs/swagger';

export type createChatParams = {
  name: string;
  password: string;
  private: boolean;
  ownerID: number;
};

export type createDMParams = {
  name: string;
  password: string;
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
