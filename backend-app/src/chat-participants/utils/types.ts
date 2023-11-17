export type createParticipantParams = {
	chatRoomID: number;
	userID: number;
	isOperator?: boolean;
	isOwner?: boolean;
	isBanned?: boolean;
	mutedUntil?: number;
};

export type updateParticipantParams = {
	isOperator?: boolean;
	isOwner?: boolean;
	isBanned?: boolean;
	mutedUntil?: number;
};

export type UserChatInfo = {
	chatRoomID: number;
	userID: number;
};
