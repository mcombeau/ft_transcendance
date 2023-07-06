import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { ChatEntity } from "./chat.entity";
import { UserEntity } from "./user.entity";

@Entity({ name: 'chat-messages' })
export class ChatMessageEntity {
    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    message: string;
    @Column()
    sentAt: Date;
    @ManyToOne( () => ChatEntity, (chat) => chat.messages )
    chatRoom: ChatEntity;
    @OneToOne( ()=> UserEntity )
    @JoinColumn()
    sender: UserEntity;
}