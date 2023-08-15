import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ChatMessageEntity } from "../../chat-messages/entities/chat-message.entity";
import { ChatParticipantEntity } from "../../chat-participants/entities/chat-participant.entity";
import { ApiProperty } from "@nestjs/swagger";

@Entity({ name: 'users' })
export class UserEntity {

    @ApiProperty()
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty()
    @Column({ unique: true })
    username: string;

    @ApiProperty()
    @Column({ nullable: true })
    password: string;

    @ApiProperty()
    @Column()
    email: string;

    @ApiProperty()
    @Column()
    createdAt: Date;

    @ApiProperty({ type: () => ChatMessageEntity, isArray: true })
    @OneToMany( () => ChatMessageEntity, (chatMessage) => chatMessage.sender, { nullable: true } )
    messages: ChatMessageEntity[];

    @ApiProperty({ type: () => ChatParticipantEntity, isArray: true })
    @OneToMany( () => ChatParticipantEntity, (participant) => participant.participant, { nullable: true } )
    chatRooms: ChatParticipantEntity[];
}