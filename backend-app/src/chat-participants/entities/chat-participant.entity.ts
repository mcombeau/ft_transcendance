import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChatEntity } from '../../chats/entities/chat.entity';
import { UserEntity } from '../../users/entities/user.entity';

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
  @Column({ default: new Date().getTime(), type: 'bigint' })
  muted: number;
  @ManyToOne(() => ChatEntity, (chat) => chat.participants, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  chatRoom: ChatEntity;
  @ManyToOne(() => UserEntity, (user) => user.chatRooms, { cascade: true })
  participant: UserEntity;
}
