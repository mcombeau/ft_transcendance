import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ChatMessageEntity } from './chat-message.entity';

@Entity({ name: 'chats' })
export class ChatEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ unique: true })
  name: string;
  @Column()
  password: string;
  @Column()
  createdAt: Date;
  @OneToMany(() => ChatMessageEntity, (chatMessage) => chatMessage.chatRoom, {
    nullable: true,
  })
  messages: ChatMessageEntity[];
}
