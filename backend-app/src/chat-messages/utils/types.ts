import { ChatEntity } from "src/typeorm/entities/chat.entity";

export type createChatMessageParams = {
    message: string;
    sender: number;
    chatRoom: number;
};