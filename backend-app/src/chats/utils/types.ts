export type createChatParams = {
  name: string;
  password: string;
  private: boolean;
  owner: string;
};

export type createDMParams = {
  name: string;
  password: string;
  user1: string;
  user2: string;
};

export type updateChatParams = {
  name: string;
  password: string;
  private: boolean;
  participantID: number;
};

export type participantUsernames = {
  username: string;
}

