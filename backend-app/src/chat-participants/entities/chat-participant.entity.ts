import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ChatEntity } from "../../chats/entities/chat.entity";
import { UserEntity } from "../../users/entities/user.entity";
import { ApiProperty } from "@nestjs/swagger";

@Entity({ name: "chat_participants" })
export class ChatParticipantEntity {
	@ApiProperty()
	@PrimaryGeneratedColumn()
	id: number;

	@ApiProperty()
	@Column({ default: false })
	isOwner: boolean;

	@ApiProperty()
	@Column({ default: false })
	isOperator: boolean;

	@ApiProperty()
	@Column({ default: false })
	isBanned: boolean;

	@ApiProperty()
	@Column({ default: new Date().getTime(), type: "bigint" })
	mutedUntil: number;

	@ApiProperty({ type: () => ChatEntity, isArray: true })
	@ManyToOne(() => ChatEntity, (chat) => chat.participants, {
		cascade: true,
		onDelete: "CASCADE",
	})
	chatRoom: ChatEntity;

	@ApiProperty({ type: () => UserEntity, isArray: true })
	@ManyToOne(() => UserEntity, (user) => user.chatRooms, {
		cascade: true,
		onDelete: "CASCADE",
	})
	user: UserEntity;
}
