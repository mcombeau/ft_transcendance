import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ChatEntity } from "./chat.entity";

@Entity({ name: 'chat-messages' })
export class ChatMessageEntity {
    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    message: string;
    @Column()
    sender: number;
    @Column()
    sentAt: Date;
    @ManyToOne( () => ChatEntity, (chat) => chat.messages )
    chatRoom: ChatEntity;
}