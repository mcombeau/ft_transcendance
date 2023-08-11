import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ChatMessageEntity } from '../../chat-messages/entities/chat-message.entity';
import { ChatParticipantEntity } from '../../chat-participants/entities/chat-participant.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'chats' })
export class ChatEntity {

  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column({ unique: true })
  name: string;

  @ApiProperty()
  @Column()
  password: string;

  @ApiProperty()
  @Column()
  private: boolean;

  @ApiProperty()
  @Column()
  directMessage: boolean;

  @Column()
  createdAt: Date;

  @ApiProperty({ type: () => ChatMessageEntity, isArray: true })
  @OneToMany(() => ChatMessageEntity, (chatMessage) => chatMessage.chatRoom, {
    nullable: true,
  })
  messages: ChatMessageEntity[];

  @ApiProperty({ type: () => ChatParticipantEntity, isArray: true })
  @OneToMany(() => ChatParticipantEntity, (participant) => participant.chatRoom, {
    nullable: true
  })
  participants: ChatParticipantEntity[];
}

