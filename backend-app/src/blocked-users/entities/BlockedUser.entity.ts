import {Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {UserEntity} from '../../users/entities/user.entity';
import {ApiProperty} from '@nestjs/swagger';

@Entity({name: 'blockedUser'})
export class BlockedUserEntity {
	@ApiProperty()
	@PrimaryGeneratedColumn()
	id: number;

	@ApiProperty({type: () => UserEntity, isArray: true})
	@ManyToOne(() => UserEntity, (user) => user.blockedUsers, {
		cascade: true,
	})
	blockingUser: UserEntity;

	@ApiProperty({type: () => UserEntity, isArray: true})
	@ManyToOne(() => UserEntity, (user) => user.blockedByUsers, {
		cascade: true,
	})
	blockedUser: UserEntity;
}
