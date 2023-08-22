export type ReceivedInfo = {
  token: string;
  username?: string;
  userID?: number;
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
  isPrivate: boolean;
};

export type updateParticipantParams = {
  operator?: boolean;
  owner?: boolean;
  banned?: boolean;
  mutedUntil?: number;
};

export type Message = {
  datestamp: Date;
  msg: string;
  senderID: number;
  senderUsername: string;
  chatRoomID: number;
  read: boolean;
  system: boolean;
};

export type User = {
  userID: number;
  username: string;
  isOwner: boolean;
  isOperator: boolean;
  isBanned: boolean;
  mutedUntil: number;
  invitedUntil: number;
};

export type ChatRoom = {
  chatRoomID: number;
  name: string;
  ownerID: number;
  participants: User[];
  invited: User[];
  banned: User[];
  isPrivate: boolean;
  isDM: boolean;
};

export enum typeInvite {
  Chat,
  Game,
  Friend,
}

export type Invite = {
  targetID: number;
  senderID: number;
  type: typeInvite;
  chatRoomID: number;
  expirationDate: number;
};

export enum Status {
  Normal,
  Operator,
  Owner,
}
