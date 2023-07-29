import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'games' })
export class GameEntity {

  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;
  
  @ApiProperty()
  @Column()
  winnerID: number;
  
  @ApiProperty()
  @Column()
  loserID: number;
  
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

