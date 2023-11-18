import { Module, forwardRef } from "@nestjs/common";
import { UsersModule } from "src/users/users.module";
import { ChatsModule } from "src/chats/chats.module";
import { ValidateInputService } from "./validate-input.service";

@Module({
	imports: [forwardRef(() => UsersModule), forwardRef(() => ChatsModule)],
	providers: [ValidateInputService],
	exports: [ValidateInputService],
})
export class ValidateInputModule {}
