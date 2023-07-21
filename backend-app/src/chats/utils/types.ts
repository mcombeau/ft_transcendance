export type createChatParams = {
    name: string;
    password: string;
    ownerID: number;
};

export type updateChatParams = {
    name: string;
    password: string;
    participantID: number;
};