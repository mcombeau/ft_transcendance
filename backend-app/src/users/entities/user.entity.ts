import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ChatMessageEntity } from '../../chat-messages/entities/chat-message.entity';
import { ChatParticipantEntity } from '../../chat-participants/entities/chat-participant.entity';
import { ApiProperty } from '@nestjs/swagger';
import { GameEntity } from 'src/games/entities/game.entity';
import { InviteEntity } from 'src/invites/entities/Invite.entity';

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

  @ApiProperty()
  @Column({ nullable: true, select: false })
  password: string;

  @ApiProperty()
  @Column()
  email: string;

  @ApiProperty()
  @Column()
  createdAt: Date;

  @ApiProperty({ type: () => ChatMessageEntity, isArray: true })
  @OneToMany(() => ChatMessageEntity, (chatMessage) => chatMessage.sender, {
    nullable: true,
  })
  messages: ChatMessageEntity[];

  @ApiProperty({ type: () => ChatParticipantEntity, isArray: true })
  @OneToMany(
    () => ChatParticipantEntity,
    (participant) => participant.participant,
    { nullable: true },
  )
  chatRooms: ChatParticipantEntity[];

  @ApiProperty({ type: () => InviteEntity, isArray: true })
  @OneToMany(() => InviteEntity, (invite) => invite.invitedUser, {
    nullable: true,
  })
  receivedInvites: InviteEntity[];

  @ApiProperty({ type: () => InviteEntity, isArray: true })
  @OneToMany(() => InviteEntity, (invite) => invite.inviteSender, {
    nullable: true,
  })
  sentInvites: InviteEntity[];

  @ApiProperty({ type: () => GameEntity, isArray: true })
  @OneToMany(() => GameEntity, (game) => game.winnerID, { nullable: true })
  wonGames: GameEntity[];
}
