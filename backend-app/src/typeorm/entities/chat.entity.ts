import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'chats' })
export class ChatEntity {
    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    message: string;
    @Column()
    sentAt: Date;
}