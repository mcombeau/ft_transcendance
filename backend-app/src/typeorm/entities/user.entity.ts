import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'users' })
export class UserEntity {
    @PrimaryGeneratedColumn()
    id: number;
    @Column({ unique: true })
    username: string;
    @Column()
    email: string;
    @Column()
    createdAt: Date;
}