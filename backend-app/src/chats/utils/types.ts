export type createChatParams = {
  name: string;
  ownerID?: number;
  password?: string;
  isPrivate?: boolean;
};

export type createDMParams = {
  userID1: number;
  userID2: number;
};

export type updateChatParams = {
  name?: string;
  password?: string;
  isPrivate?: boolean;
  participantID?: number;
};
