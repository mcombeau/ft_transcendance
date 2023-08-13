import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ChatMessageEntity } from '../../chat-messages/entities/chat-message.entity';
import { ChatParticipantEntity } from '../../chat-participants/entities/chat-participant.entity';
import { ApiProperty } from '@nestjs/swagger';
import { InviteEntity } from '../../invites/entities/Invite.entity';

@Entity({ name: 'chats' })
export class ChatEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  password: string;

  @Column()
  private: boolean;

  @Column()
  directMessage: boolean;

  @Column()
  createdAt: Date;

  @OneToMany(() => ChatMessageEntity, (chatMessage) => chatMessage.chatRoom, {
    nullable: true,
  })
  messages: ChatMessageEntity[];

  @OneToMany(
    () => ChatParticipantEntity,
    (participant) => participant.chatRoom,
    {
      nullable: true,
    },
  )
  participants: ChatParticipantEntity[];

  @ApiProperty({ type: () => InviteEntity, isArray: true })
  @OneToMany(() => InviteEntity, (invite) => invite.chatRoom, {
    nullable: true,
  })
  invitedUsers: InviteEntity[];
}
