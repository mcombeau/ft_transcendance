import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'chats' })
export class ChatEntity {
    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    name: string;
    @Column()
    password: string;
    @Column()
    createdAt: Date;
}