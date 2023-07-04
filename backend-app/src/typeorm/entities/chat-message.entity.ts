import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'chat-messages' })
export class ChatMessageEntity {
    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    message: string;
    @Column()
    sender: number;
    @Column()
    destination: number;
    @Column()
    sentAt: Date;
}