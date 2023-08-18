import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ChatEntity } from '../../chats/entities/chat.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum inviteType {
  CHAT = 'chat',
  GAME = 'game',
  FRIEND = 'friend',
}

@Entity({ name: 'invites' })
export class InviteEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: inviteType, default: inviteType.CHAT })
  type: inviteType;

  @ApiProperty()
  @Column({ default: new Date().getTime(), type: 'bigint' })
  expiresAt: number;

  @ApiProperty({ type: () => UserEntity, isArray: true })
  @ManyToOne(() => UserEntity, (user) => user.sentInvites, { cascade: true })
  inviteSender: UserEntity;

  @ApiProperty({ type: () => UserEntity, isArray: true })
  @ManyToOne(() => UserEntity, (user) => user.receivedInvites, {
    cascade: true,
  })
  invitedUser: UserEntity;

  @ApiProperty({ type: () => ChatEntity })
  @ManyToOne(() => ChatEntity, (chat) => chat.invitedUsers, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  chatRoom: ChatEntity;

  // @ApiProperty({ type: () => GameEntity })
  // @ManyToOne(() => GameEntity, (game) => game.invitedUsers, {
  //   cascade: true,
  //   onDelete: 'CASCADE',
  // })
  // gameRoom: GameEntity;
}
