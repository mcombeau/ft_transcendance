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
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
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
import { max } from "rxjs";

@ApiTags("users")
@Controller("users")
export class UsersController {
	constructor(private userService: UsersService) {}

	@UseGuards(JwtAuthGuard)
	@Get(":id")
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

	@UseGuards(JwtAuthGuard)
	@Get(":id/chats")
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

	@UseGuards(JwtAuthGuard)
	@Get(":id/DMs")
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

	@UseGuards(JwtAuthGuard)
	@Get(":id/games")
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

	@UseGuards(JwtAuthGuard)
	@Get(":id/friends")
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

	@UseGuards(JwtAuthGuard)
	@Get(":id/blockedUsers")
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

	@UseGuards(JwtAuthGuard)
	@Get(":id/avatar")
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

	// @UseGuards(JwtAuthGuard)
	@Get()
	@ApiOkResponse({
		type: UserEntity,
		isArray: true,
		description: "Get all users.",
	})
	getUsers(): Promise<UserEntity[]> {
		return this.userService.fetchUsers();
	}

	// TODO: Make sure you can't change someone else's avatar
	@UseGuards(JwtAuthGuard)
	@Post(":id/avatar")
	@UseInterceptors(FileInterceptor("file"))
	async uploadUserAvatarByUserID(
		@Param("id", ParseIntPipe) id: number,
		@UploadedFile(
			new ParseFilePipe({
				validators: [
					new MaxFileSizeValidator({ maxSize: 50000000 }),
					new FileTypeValidator({ fileType: ".(png|jpeg|jpg)" }),
				],
			})
		)
		file: Express.Multer.File
	) {
		console.log("[User Controller] Uploading file", file);
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

	@UseGuards(JwtAuthGuard)
	@Patch(":id")
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

	@UseGuards(JwtAuthGuard)
	@Delete(":id/avatar")
	async deleteUserAvatarByUserID(@Param("id", ParseIntPipe) id: number) {
		return this.userService.removeUserAvatarByUserID(id);
	}

	@Delete(":id")
	@ApiOkResponse({ description: "Record deleted by ID." })
	@ApiBadRequestResponse({ description: "Bad request" })
	@ApiUnprocessableEntityResponse({
		description: "Database error. (Unprocessable entity)",
	})
	async deleteUserByID(
		@Param("id", ParseIntPipe) id: number
	): Promise<DeleteResult> {
		return this.userService.deleteUserByID(id);
	}
}
