import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ChatMessageEntity } from '../../chat-messages/entities/chat-message.entity';
import { ChatParticipantEntity } from '../../chat-participants/entities/chat-participant.entity';
import { ApiProperty } from '@nestjs/swagger';
import { GameEntity } from 'src/games/entities/game.entity';
import { InviteEntity } from 'src/invites/entities/Invite.entity';

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
  @OneToMany(() => ChatMessageEntity, (chatMessage) => chatMessage.sender, {
    nullable: true,
  })
  messages: ChatMessageEntity[];
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
  @OneToMany(() => GameEntity, (game) => game.loserID, { nullable: true })
  lostGames: GameEntity[];

  @ApiProperty({ type: () => GameEntity, isArray: true })
  @OneToMany(() => GameEntity, (game) => game.winnerID, { nullable: true })
  wonGames: GameEntity[];
}
