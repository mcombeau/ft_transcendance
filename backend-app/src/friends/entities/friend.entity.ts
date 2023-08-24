import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'friends' })
export class FriendEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  message: string;
  @Column()
  sentAt: Date;
}

