import { Module, forwardRef } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "src/users/entities/user.entity";
import { PasswordModule } from "src/password/password.module";
import { ChatsModule } from "src/chats/chats.module";
import { GamesModule } from "src/games/games.module";
import { FriendsModule } from "src/friends/friends.module";
import { BlockedUsersModule } from "src/blocked-users/blockedUsers.module";
import { ValidateInputModule } from "src/validate-input/validate-input.module";

@Module({
	imports: [
		TypeOrmModule.forFeature([UserEntity]),
		forwardRef(() => PasswordModule),
		forwardRef(() => ValidateInputModule),
		forwardRef(() => ChatsModule),
		forwardRef(() => GamesModule),
		forwardRef(() => FriendsModule),
		forwardRef(() => BlockedUsersModule),
	],
	controllers: [UsersController],
	providers: [UsersService],
	exports: [UsersService],
})
export class UsersModule {}
