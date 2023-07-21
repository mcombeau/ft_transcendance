import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { ChatEntity } from "./chat.entity";
import { UserEntity } from "./user.entity";

@Entity({ name: 'chat_participants' })
export class ChatParticipantEntity {
    @PrimaryGeneratedColumn()
    id: number;
    @Column({ default: false })
    owner: boolean;
    @Column({ default: false })
    operator: boolean;
    @Column({ default: false })
    banned: boolean;
    @Column({ default: false })
    muted: boolean;
    @ManyToOne( () => ChatEntity, (chat) => chat.participants, { cascade: true })
    chatRoom: ChatEntity;
    @ManyToOne( () => UserEntity, (user) => user.chatRooms, { cascade: true })
    participant: UserEntity;
}