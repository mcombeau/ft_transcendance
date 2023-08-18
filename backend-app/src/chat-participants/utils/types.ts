export type updateParticipantParams = {
  operator: boolean;
  owner: boolean;
  banned: boolean;
  mutedUntil: number;
};

export type UserChatInfo = {
  chatRoomID: number;
  userID: number;
};
