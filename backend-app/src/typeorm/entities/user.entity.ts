import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ChatMessageEntity } from "./chat-message.entity";
import { ChatParticipantEntity } from "./chat-participant.entity";

@Entity({ name: 'users' })
export class UserEntity {
    @PrimaryGeneratedColumn()
    id: number;
    @Column({ unique: true })
    username: string;
    @Column()
    email: string;
    @Column()
    createdAt: Date;
    @OneToMany( () => ChatMessageEntity, (chatMessage) => chatMessage.sender, { nullable: true } )
    messages: ChatMessageEntity[];
    @OneToMany( () => ChatParticipantEntity, (participant) => participant.participant, { nullable: true } )
    chatRooms: ChatMessageEntity[];
}