import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	UseGuards,
	UploadedFile,
	UseInterceptors,
	Res,
	ParseFilePipe,
	MaxFileSizeValidator,
	FileTypeValidator,
} from "@nestjs/common";
import {
	ApiBadRequestResponse,
	ApiCreatedResponse,
	ApiOkResponse,
	ApiTags,
	ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { UserNotFoundException } from "src/exceptions/not-found.exception";
import { createUsersDto } from "src/users/dtos/createUsers.dto";
import { updateUsersDto } from "src/users/dtos/updateUsers.dto";
import { UsersService } from "src/users/users.service";
import { sendBlockedUserDto } from "src/blocked-users/dtos/sendBlockedUser.dto";
import { UserEntity } from "./entities/user.entity";
import { ChatEntity } from "src/chats/entities/chat.entity";
import { sendGameDto } from "src/games/dtos/sendGame.dto";
import { sendFriendDto } from "src/friends/dtos/sendFriend.dto";
import { UpdateResult, DeleteResult } from "typeorm";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response, Express } from "express";
import { JwtFullAuthGuard } from "src/auth/guards/jwt-full-auth.guard";
import { JwtSelfAuthGuard } from "src/auth/guards/jwt-self-auth.guard";

@ApiTags("users")
@Controller("users")
export class UsersController {
	constructor(private userService: UsersService) {}

	@Get("username/:username")
	@UseGuards(JwtFullAuthGuard)
	@ApiOkResponse({
		type: UserEntity,
		description: "Get user by username.",
	})
	async getUserByUsername(
		@Param("username") username: string
	): Promise<UserEntity> {
		const user = await this.userService.fetchUserByUsername(username);
		if (!user) throw new UserNotFoundException(username);
		return user;
	}

	@Get(":id")
	@UseGuards(JwtFullAuthGuard)
	@ApiOkResponse({
		type: UserEntity,
		description: "Get user by ID.",
	})
	async getUserByID(
		@Param("id", ParseIntPipe) id: number
	): Promise<UserEntity> {
		const user = await this.userService.fetchUserByID(id);
		if (!user) throw new UserNotFoundException(id.toString());
		return user;
	}

	@Get(":id/chats")
	@UseGuards(JwtFullAuthGuard, JwtSelfAuthGuard)
	@ApiOkResponse({
		type: ChatEntity,
		isArray: true,
		description: "Get user chats (including DMs) by user ID.",
	})
	async getUserChatsByUserID(
		@Param("id", ParseIntPipe) id: number
	): Promise<ChatEntity[]> {
		return this.userService.fetchUserChatsByUserID(id);
	}

	@Get(":id/DMs")
	@UseGuards(JwtFullAuthGuard, JwtSelfAuthGuard)
	@ApiOkResponse({
		type: ChatEntity,
		isArray: true,
		description: "Get user DM chats (only DMs) by user ID.",
	})
	async getUserChatDMsByUserID(
		@Param("id", ParseIntPipe) id: number
	): Promise<ChatEntity[]> {
		return this.userService.fetchUserChatDMsByUserID(id);
	}

	@Get(":id/games")
	@UseGuards(JwtFullAuthGuard)
	@ApiOkResponse({
		type: sendGameDto,
		isArray: true,
		description: "Get user games by user ID.",
	})
	async getUserGamesByUserID(
		@Param("id", ParseIntPipe) id: number
	): Promise<sendGameDto[]> {
		return this.userService.fetchUserGamesByUserID(id);
	}

	@Get(":id/friends")
	@UseGuards(JwtFullAuthGuard)
	@ApiOkResponse({
		type: sendFriendDto,
		isArray: true,
		description: "Get user friends by user ID.",
	})
	async getUserFriendsByUserID(
		@Param("id", ParseIntPipe) id: number
	): Promise<sendFriendDto[]> {
		return this.userService.fetchUserFriendsByUserID(id);
	}

	@Get(":id/blockedUsers")
	@UseGuards(JwtFullAuthGuard, JwtSelfAuthGuard)
	@ApiOkResponse({
		type: sendBlockedUserDto,
		isArray: true,
		description: "Get blocked user list by user ID.",
	})
	async getUserBlockedUsersByUserID(
		@Param("id", ParseIntPipe) id: number
	): Promise<sendBlockedUserDto[]> {
		return this.userService.fetchUserBlockedUsersByUserID(id);
	}

	@Get(":id/avatar")
	@UseGuards(JwtFullAuthGuard)
	@ApiOkResponse({
		description: "Get avatar by user ID.",
	})
	async getUserAvatarByUserID(
		@Param("id", ParseIntPipe) id: number,
		@Res() res: Response
	) {
		const file = await this.userService.fetchUserAvatarByUserID(id);
		file.pipe(res);
	}

	@Get()
	@UseGuards(JwtFullAuthGuard)
	@ApiOkResponse({
		type: UserEntity,
		isArray: true,
		description: "Get all users.",
	})
	getUsers(): Promise<UserEntity[]> {
		return this.userService.fetchUsers();
	}

	@Post(":id/avatar")
	@UseGuards(JwtFullAuthGuard, JwtSelfAuthGuard)
	@UseInterceptors(FileInterceptor("file"))
	async uploadUserAvatarByUserID(
		@Param("id", ParseIntPipe) id: number,
		@UploadedFile(
			new ParseFilePipe({
				validators: [
					new MaxFileSizeValidator({ maxSize: 1_000_000 }), // In bytes
					new FileTypeValidator({ fileType: ".(png|jpeg|jpg)" }),
				],
			})
		)
		file: Express.Multer.File
	) {
		await this.userService.saveUserAvatarByUserID(id, file);
	}

	@Post()
	@ApiCreatedResponse({ type: UserEntity, description: "Record created." })
	@ApiBadRequestResponse({ description: "Bad request." })
	@ApiUnprocessableEntityResponse({
		description: "Database error. (Unprocessable entity)",
	})
	createUser(@Body() userDto: createUsersDto): Promise<UserEntity> {
		return this.userService.createUser(userDto);
	}

	@Patch(":id")
	@UseGuards(JwtFullAuthGuard, JwtSelfAuthGuard)
	@ApiCreatedResponse({ description: "Record updated." })
	@ApiBadRequestResponse({ description: "Bad request" })
	@ApiUnprocessableEntityResponse({
		description: "Database error. (Unprocessable entity)",
	})
	async updateUserByID(
		@Param("id", ParseIntPipe) id: number,
		@Body() updateUserDto: updateUsersDto
	): Promise<UpdateResult> {
		return this.userService.updateUserByID(id, updateUserDto);
	}

	@Delete(":id/avatar")
	@UseGuards(JwtFullAuthGuard, JwtSelfAuthGuard)
	async deleteUserAvatarByUserID(@Param("id", ParseIntPipe) id: number) {
		return this.userService.removeUserAvatarByUserID(id);
	}
}
