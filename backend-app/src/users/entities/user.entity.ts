import {
  Column,
  Entity,
  OneToMany,
  ManyToMany,
  JoinTable,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChatMessageEntity } from '../../chat-messages/entities/chat-message.entity';
import { ChatParticipantEntity } from '../../chat-participants/entities/chat-participant.entity';
import { ApiProperty } from '@nestjs/swagger';
import { GameEntity } from 'src/games/entities/game.entity';
import { InviteEntity } from 'src/invites/entities/Invite.entity';
import { FriendEntity } from 'src/friends/entities/Friend.entity';
import { BlockedUserEntity } from 'src/blocked-users/entities/BlockedUser.entity';

export enum userStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  INGAME = 'in game',
}
@Entity({ name: 'users' })
export class UserEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column({ unique: true })
  username: string;

  @ApiProperty()
  @Column({ unique: true, nullable: true })
  login42: string;

  // @ApiProperty()
  @Column({ nullable: true, select: false })
  password: string;

  @ApiProperty()
  @Column()
  email: string;

  @ApiProperty()
  @Column()
  createdAt: Date;

  @ApiProperty()
  @Column({ type: 'enum', enum: userStatus, default: userStatus.OFFLINE })
  status: userStatus;

  @ApiProperty()
  @Column()
  isTwoFactorAuthenticationEnabled: boolean;

  // @ApiProperty()
  @Column({ nullable: true, select: false })
  twoFactorAuthenticationSecret: string;

  // @ApiProperty({ type: () => ChatMessageEntity, isArray: true })
  @OneToMany(() => ChatMessageEntity, (chatMessage) => chatMessage.sender, {
    nullable: true,
  })
  messages: ChatMessageEntity[];

  // @ApiProperty({ type: () => ChatParticipantEntity, isArray: true })
  @OneToMany(() => ChatParticipantEntity, (participant) => participant.user, {
    nullable: true,
  })
  chatRooms: ChatParticipantEntity[];

  // @ApiProperty({ type: () => InviteEntity, isArray: true })
  @OneToMany(() => InviteEntity, (invite) => invite.invitedUser, {
    nullable: true,
  })
  receivedInvites: InviteEntity[];

  // @ApiProperty({ type: () => InviteEntity, isArray: true })
  @OneToMany(() => InviteEntity, (invite) => invite.inviteSender, {
    nullable: true,
  })
  sentInvites: InviteEntity[];

  // @ApiProperty({ type: () => GameEntity, isArray: true })
  @OneToMany(() => GameEntity, (game) => game.winner, { nullable: true })
  wonGames: GameEntity[];

  // @ApiProperty({ type: () => GameEntity, isArray: true })
  @OneToMany(() => GameEntity, (game) => game.loser, { nullable: true })
  lostGames: GameEntity[];

  // @ApiProperty({ type: () => FriendEntity, isArray: true })
  @OneToMany(() => FriendEntity, (friend) => friend.user1, { nullable: true })
  friendTo: FriendEntity[];

  // @ApiProperty({ type: () => FriendEntity, isArray: true })
  @OneToMany(() => FriendEntity, (friend) => friend.user2, { nullable: true })
  friendOf: FriendEntity[];

  // @ApiProperty({ type: () => FriendEntity, isArray: true })
  @OneToMany(
    () => BlockedUserEntity,
    (blockedUser) => blockedUser.blockingUser,
    { nullable: true },
  )
  blockedUsers: BlockedUserEntity[];

  // @ApiProperty({ type: () => FriendEntity, isArray: true })
  @OneToMany(
    () => BlockedUserEntity,
    (blockedUser) => blockedUser.blockedUser,
    { nullable: true },
  )
  blockedByUsers: BlockedUserEntity[];
}
