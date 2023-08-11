import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'games' })
export class GameEntity {

  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: () => UserEntity })
  @ManyToOne(() => UserEntity, (user) => user.wonGames, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  winner: UserEntity;

  @ApiProperty({ type: () => UserEntity })
  @ManyToOne(() => UserEntity, (user) => user.lostGames, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  loser: UserEntity;
  
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

