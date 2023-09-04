export type ReceivedInfo = {
  token: string;
  username?: string;
  username2?: string;
  userID?: number;
  targetID?: number;
  chatRoomID?: number;
  messageInfo?: createChatMessageParams;
  chatInfo?: createChatParams;
  participantInfo?: updateParticipantParams;
  inviteInfo?: Invite;
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
  isOperator?: boolean;
  isOwner?: boolean;
  isBanned?: boolean;
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
  messages: Message[];
  invited: User[];
  banned: User[];
  isPrivate: boolean;
  isDM: boolean;
};

export type PublicChatRoom = {
  chatRoomID: number;
  name: string;
};

export enum typeInvite {
  Chat = "chat",
  Game = "game",
  Friend = "friend",
}

export type Invite = {
  id: number;
  invitedID: number;
  senderID: number;
  invitedUsername: string;
  senderUsername: string;
  type: typeInvite;
  chatRoomID?: number;
  chatRoomName?: string;
  expiresAt: number;
};

export enum Status {
  Normal,
  Operator,
  Owner,
}
