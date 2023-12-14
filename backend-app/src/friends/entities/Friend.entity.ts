import { Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { UserEntity } from "../../users/entities/user.entity";
import { ApiProperty } from "@nestjs/swagger";

@Entity({ name: "friends" })
export class FriendEntity {
	@ApiProperty()
	@PrimaryGeneratedColumn()
	id: number;

	@ApiProperty({ type: () => UserEntity, isArray: true })
	@ManyToOne(() => UserEntity, (user1) => user1.friendTo, {
		cascade: true,
		onDelete: "CASCADE",
	})
	user1: UserEntity;

	@ApiProperty({ type: () => UserEntity, isArray: true })
	@ManyToOne(() => UserEntity, (user2) => user2.friendOf, {
		cascade: true,
		onDelete: "CASCADE",
	})
	user2: UserEntity;
}
