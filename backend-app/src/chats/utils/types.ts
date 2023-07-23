export type createChatParams = {
  name: string;
  password: string;
  private: boolean;
  owner: string;
};

export type updateChatParams = {
  name: string;
  password: string;
  private: boolean;
  participantID: number;
};

