import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ChatMessageEntity } from '../../chat-messages/entities/chat-message.entity';
import { ChatParticipantEntity } from '../../chat-participants/entities/chat-participant.entity';
import { ApiProperty } from '@nestjs/swagger';
import { InviteEntity } from '../../invites/entities/Invite.entity';

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
  isPrivate: boolean;

  @ApiProperty()
  @Column()
  directMessage: boolean;

  @ApiProperty()
  @Column()
  createdAt: Date;

  @ApiProperty({ type: () => ChatMessageEntity, isArray: true })
  @OneToMany(() => ChatMessageEntity, (chatMessage) => chatMessage.chatRoom, {
    nullable: true,
  })
  messages: ChatMessageEntity[];

  @ApiProperty({ type: () => ChatParticipantEntity, isArray: true })
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
