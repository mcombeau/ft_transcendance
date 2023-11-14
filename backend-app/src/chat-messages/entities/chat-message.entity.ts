import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {ChatEntity} from '../../chats/entities/chat.entity';
import {UserEntity} from '../../users/entities/user.entity';
import {ApiProperty} from '@nestjs/swagger';

@Entity({name: 'chat_messages'})
export class ChatMessageEntity {
	@ApiProperty()
	@PrimaryGeneratedColumn()
	id: number;

	@ApiProperty()
	@Column()
	message: string;

	@ApiProperty()
	@Column()
	sentAt: Date;

	@ApiProperty({type: () => ChatEntity})
	@ManyToOne(() => ChatEntity, (chat) => chat.messages)
	chatRoom: ChatEntity;

	@ApiProperty({type: () => UserEntity})
	@ManyToOne(() => UserEntity, (user) => user.messages)
	sender: UserEntity;
}

