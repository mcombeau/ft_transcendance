import { Module, forwardRef } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/users/entities/user.entity';
import { PasswordModule } from 'src/password/password.module';
import { ChatsModule } from 'src/chats/chats.module';
import { GamesModule } from 'src/games/games.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    forwardRef(() => PasswordModule),
    forwardRef(() => ChatsModule),
    forwardRef(() => GamesModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
