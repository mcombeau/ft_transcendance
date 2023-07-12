import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'games' })
export class GameEntity {
    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    winnerID: number;
    @Column()
    loserID: number;
    @Column()
    winnerScore: number;
    @Column()
    loserScore: number;
    @Column()
    createdAt: Date;

}