import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ChatMessageEntity } from "./chat-message.entity";

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