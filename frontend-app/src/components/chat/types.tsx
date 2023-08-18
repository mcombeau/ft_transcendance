export type ReceivedInfo = {
  token: string;
  targetID?: number;
  chatRoomID?: number;
  messageInfo?: createChatMessageParams;
  chatInfo?: createChatParams;
  participantInfo?: updateParticipantParams;
  inviteDate?: number;
};

export type createChatMessageParams = {
  message: string;
  sentAt: Date;
};

export type createChatParams = {
  name: string;
  password: string;
  private: boolean;
};

export type updateParticipantParams = {
  operator?: boolean;
  owner?: boolean;
  banned?: boolean;
  mutedUntil?: number;
};
