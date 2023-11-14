import {ApiProperty} from '@nestjs/swagger';
import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {UserEntity} from 'src/users/entities/user.entity';

@Entity({name: 'games'})
export class GameEntity {
	@ApiProperty()
	@PrimaryGeneratedColumn()
	id: number;

	@ApiProperty({type: () => UserEntity, isArray: true})
	@ManyToOne(() => UserEntity, (user) => user.lostGames, {cascade: true})
	loser: UserEntity;

	@ApiProperty({type: () => UserEntity, isArray: true})
	@ManyToOne(() => UserEntity, (user) => user.wonGames, {cascade: true})
	winner: UserEntity;

	@ApiProperty()
	@Column()
	winnerScore: number;

	@ApiProperty()
	@Column()
	loserScore: number;

	@ApiProperty()
	@Column()
	createdAt: Date;
}
