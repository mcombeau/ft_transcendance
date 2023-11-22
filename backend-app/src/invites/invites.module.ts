import { Module, forwardRef } from "@nestjs/common";
import { InvitesController } from "./invites.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChatsModule } from "src/chats/chats.module";
import { BlockedUsersModule } from "src/blocked-users/blockedUsers.module";
import { UsersModule } from "src/users/users.module";
import { InviteEntity } from "./entities/Invite.entity";
import { InvitesService } from "./invites.service";
import { GatewayModule } from "src/gateway/gateway.module";

@Module({
	imports: [
		TypeOrmModule.forFeature([InviteEntity]),
		forwardRef(() => ChatsModule),
		forwardRef(() => UsersModule),
		forwardRef(() => BlockedUsersModule),
		forwardRef(() => GatewayModule),
	],
	controllers: [InvitesController],
	providers: [InvitesService],
	exports: [InvitesService],
})
export class InvitesModule {}
