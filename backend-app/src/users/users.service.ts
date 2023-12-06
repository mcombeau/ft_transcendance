import { Inject, Injectable, forwardRef, Logger } from "@nestjs/common";
import {
	createReadStream,
	writeFile,
	unlink,
	existsSync,
	ReadStream,
} from "fs";
import { InjectRepository } from "@nestjs/typeorm";
import { ChatEntity } from "src/chats/entities/chat.entity";
import { UserNotFoundError } from "src/exceptions/not-found.interceptor";
import { PasswordService } from "src/password/password.service";
import { UserEntity } from "src/users/entities/user.entity";
import { createUserParams } from "src/users/utils/types";
import { updateUserParams } from "src/users/utils/types";
import { Repository, UpdateResult, DeleteResult } from "typeorm";
import { ChatsService } from "src/chats/chats.service";
import { GamesService } from "src/games/games.service";
import { FriendsService } from "src/friends/friends.service";
import { BlockedUsersService } from "src/blocked-users/blockedUsers.service";
import { sendParticipantDto } from "src/chat-participants/dtos/sendChatParticipant.dto";
import { BadRequestException } from "@nestjs/common";
import { sendGameDto } from "src/games/dtos/sendGame.dto";
import { sendFriendDto } from "src/friends/dtos/sendFriend.dto";
import { sendBlockedUserDto } from "src/blocked-users/dtos/sendBlockedUser.dto";
import { join } from "path";
import { ValidateInputService } from "src/validate-input/validate-input.service";

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(UserEntity)
		private userRepository: Repository<UserEntity>,
		@Inject(forwardRef(() => PasswordService))
		private passwordService: PasswordService,
		@Inject(forwardRef(() => ValidateInputService))
		private validationService: ValidateInputService,
		@Inject(forwardRef(() => ChatsService))
		private chatsService: ChatsService,
		@Inject(forwardRef(() => GamesService))
		private gameService: GamesService,
		@Inject(forwardRef(() => FriendsService))
		private friendService: FriendsService,
		@Inject(forwardRef(() => BlockedUsersService))
		private blockedUserService: BlockedUsersService
	) {}

	private readonly logger: Logger = new Logger("Users Service");

	defaultAvatarURL = "src/images/defaultProfilePicture.jpg";

	fetchUsers(): Promise<UserEntity[]> {
		return this.userRepository.find();
	}

	fetchUserByID(id: number): Promise<UserEntity> {
		return this.userRepository.findOne({
			where: { id },
		});
	}

	fetchUserByUsername(username: string): Promise<UserEntity> {
		return this.userRepository.findOne({
			where: { username: username },
		});
	}

	async fetchUserBy42Login(login: string): Promise<UserEntity> {
		const user = await this.userRepository.findOne({
			where: { login42: login },
		});
		return user;
	}

	async fetchUserChatsByUserID(userID: number): Promise<ChatEntity[]> {
		const user = await this.userRepository.findOne({
			where: { id: userID },
			relations: ["chatRooms.chatRoom"],
		});
		if (!user || user === undefined || user === null) {
			throw new UserNotFoundError();
		}
		const userChatRooms: ChatEntity[] = [];
		for (const e of user.chatRooms) {
			const participants =
				await this.chatsService.fetchChatParticipantsByChatID(e.chatRoom.id);
			if (
				participants.some((user: sendParticipantDto) => {
					return user.userID === userID && !user.isBanned;
				})
			) {
				userChatRooms.push(e.chatRoom);
			}
		}
		return userChatRooms;
	}

	async fetchUserGamesByUserID(userID: number): Promise<sendGameDto[]> {
		return this.gameService.fetchGamesByUserID(userID);
	}

	async fetchUserFriendsByUserID(userID: number): Promise<sendFriendDto[]> {
		return this.friendService.fetchFriendsByUserID(userID);
	}

	async fetchUserBlockedUsersByUserID(
		userID: number
	): Promise<sendBlockedUserDto[]> {
		return this.blockedUserService.fetchBlockedUsersByUserID(userID);
	}

	async fetchUserChatDMsByUserID(id: number): Promise<ChatEntity[]> {
		const user = await this.userRepository.findOne({
			where: { id },
			relations: ["chatRooms.chatRoom"],
		});
		const userDMRooms: ChatEntity[] = [];
		for (const e of user.chatRooms) {
			if (e.chatRoom.isDirectMessage === true) {
				userDMRooms.push(e.chatRoom);
			}
		}
		return userDMRooms;
	}

	async fetchUserAvatarByUserID(id: number): Promise<ReadStream> {
		const user = await this.fetchUserByID(id);
		const filename = join(process.cwd(), user.avatarUrl);

		let file: ReadStream;
		if (existsSync(filename)) {
			file = createReadStream(filename);
			return file;
		} else {
			file = createReadStream(join(process.cwd(), this.defaultAvatarURL));
			return file;
		}
	}

	async createUser(userDetails: createUserParams): Promise<UserEntity> {
		if (userDetails.password) {
			await this.validationService.validatePassword(userDetails.password);
		}
		const hashedPassword: string = await this.passwordService.hashPassword(
			userDetails.password
		);
		userDetails.password = hashedPassword;
		await this.validationService.validateUsername(userDetails.username);
		const newUserInfo: UserEntity = this.userRepository.create({
			...userDetails,
			isTwoFactorAuthenticationEnabled: false,
			twoFactorAuthenticationSecret: "",
			createdAt: new Date(),
			avatarUrl: this.defaultAvatarURL,
		});
		await this.userRepository.save(newUserInfo);
		return this.fetchUserByID(newUserInfo.id);
	}

	async getUserPasswordHash(userID: number): Promise<string> {
		const user = await this.userRepository.findOne({
			where: { id: userID },
			select: ["password"],
		});
		return user.password;
	}

	private unlinkAvatar(filename: string) {
		if (filename === this.defaultAvatarURL) {
			return;
		}
		unlink(filename, (err) => {
			if (err) {
				this.logger.error(
					`[Remove Avatar] Failed to remove avatar ${filename}`
				);
			} else {
				this.logger.debug(
					`[Remove Avatar] Avatar ${filename} removed successfully!`
				);
			}
		});
	}

	private deleteUserAvatarFileByID(id: number) {
		this.unlinkAvatar(join(process.cwd(), "user_data", id + ".png"));
		this.unlinkAvatar(join(process.cwd(), "user_data", id + ".jpg"));
		this.unlinkAvatar(join(process.cwd(), "user_data", id + ".jpeg"));
	}

	async removeUserAvatarByUserID(id: number) {
		this.deleteUserAvatarFileByID(id);
		await this.updateUserByID(id, {
			avatarUrl: this.defaultAvatarURL,
		});
	}

	private async checkAvatarIsValidImage(file: Express.Multer.File) {
		const { fileTypeFromBuffer } = await (eval(
			'import("file-type")'
		) as Promise<typeof import("file-type")>);

		const type = await fileTypeFromBuffer(file.buffer);
		if (!type) {
			throw new BadRequestException("Invalid file type");
		}
		if (type.mime !== "image/png" && type.mime !== "image/jpeg") {
			throw new BadRequestException("Invalid file type");
		}
	}

	private async getAvatarFileExtension(file: Express.Multer.File) {
		const { fileTypeFromBuffer } = await (eval(
			'import("file-type")'
		) as Promise<typeof import("file-type")>);

		const type = await fileTypeFromBuffer(file.buffer);
		if (!type || !type.ext) {
			throw new BadRequestException("Invalid file type");
		}
		return type.ext;
	}

	async saveUserAvatarByUserID(id: number, file: Express.Multer.File) {
		const user = await this.fetchUserByID(id);
		await this.checkAvatarIsValidImage(file);
		this.unlinkAvatar(user.avatarUrl);
		const filename = user.id + "." + (await this.getAvatarFileExtension(file));
		const filepath = join(process.cwd(), "user_data", filename);

		writeFile(filepath, file.buffer, "binary", (err) => {
			if (!err)
				this.logger.debug(
					`[Upload Avatar] Avatar ${filename} uploaded successfully! Path: ${filepath}`
				);
		});
		await this.updateUserByID(user.id, { avatarUrl: "user_data/" + filename });
	}

	async updateUserByID(
		id: number,
		userDetails: updateUserParams
	): Promise<UpdateResult> {
		const updatedInfo: updateUserParams = {};
		if (userDetails.username) {
			await this.validationService.validateUsername(userDetails.username);
			updatedInfo.username = userDetails.username;
		}
		if (userDetails.email) updatedInfo.email = userDetails.email;
		if (userDetails.avatarUrl) updatedInfo.avatarUrl = userDetails.avatarUrl;
		if (userDetails.status) {
			this.logger.log(
				`[Update User]: Updating user ${id} status to ${userDetails.status}`
			);
			updatedInfo.status = userDetails.status;
		}

		if (userDetails.currentPassword) {
			await this.validationService.validatePassword(userDetails.newPassword);
			const user = await this.fetchUserByID(id);
			const isValidCurrentPassword = await this.passwordService.checkPassword(
				userDetails.currentPassword,
				user
			);
			if (isValidCurrentPassword) {
				const hashedPassword = await this.passwordService.hashPassword(
					userDetails.newPassword
				);
				updatedInfo.password = hashedPassword;
			} else {
				throw new BadRequestException("Invalid password");
			}
		}
		return this.userRepository.update({ id }, { ...updatedInfo });
	}

	async getUser2faSecret(userID: number): Promise<string> {
		const user = await this.userRepository.findOne({
			where: { id: userID },
			select: ["twoFactorAuthenticationSecret"],
		});
		return user.twoFactorAuthenticationSecret;
	}

	async setTwoFactorAuthenticationSecret(secret: string, id: number) {
		return this.userRepository.update(
			{ id },
			{ twoFactorAuthenticationSecret: secret }
		);
	}

	async setTwoFactorAuthentication(userID: number, state: boolean) {
		const user = await this.fetchUserByID(userID);
		this.logger.log(
			`[Set Two Factor Authentication]: ${
				state ? "Enable" : "Disable"
			} 2FA for user ${user.username}`
		);
		await this.userRepository.update(
			{ id: user.id },
			{ isTwoFactorAuthenticationEnabled: state }
		);
	}

	async deleteUserByID(id: number): Promise<DeleteResult> {
		await this.removeUserAvatarByUserID(id);
		return this.userRepository.delete({ id });
	}
}
