import {Inject, Injectable, forwardRef} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {FriendEntity} from 'src/friends/entities/Friend.entity';
import {DeleteResult, Repository} from 'typeorm';
import {createFriendParams, updateFriendParams} from './utils/types';
import {sendFriendDto} from './dtos/sendFriend.dto';
import {UsersService} from 'src/users/users.service';
import {BadRequestException} from '@nestjs/common';
import {BlockedUsersService} from 'src/blocked-users/blockedUsers.service';

@Injectable()
export class FriendsService {
	constructor(
		@InjectRepository(FriendEntity)
		private friendRepository: Repository<FriendEntity>,
		@Inject(forwardRef(() => UsersService))
		private userService: UsersService,
		@Inject(forwardRef(() => BlockedUsersService))
		private blockedUserService: BlockedUsersService,
	) {}

	private formatFriendForSending(friend: FriendEntity): sendFriendDto {
		const sendFriend: sendFriendDto = {
			userID1: friend.user1.id,
			username1: friend.user1.username,
			userStatus1: friend.user1.status,
			userID2: friend.user2.id,
			username2: friend.user2.username,
			userStatus2: friend.user2.status,
		};
		return sendFriend;
	}

	private formatFriendArrayForSending(
		friends: FriendEntity[],
	): sendFriendDto[] {
		return friends.map(this.formatFriendForSending);
	}

	async fetchFriends(): Promise<sendFriendDto[]> {
		const friends = await this.friendRepository.find({
			relations: ['user1', 'user2'],
		});
		return this.formatFriendArrayForSending(friends);
	}

	async fetchFriendByID(id: number): Promise<sendFriendDto> {
		const friend = await this.friendRepository.findOne({
			where: {id},
			relations: ['user1', 'user2'],
		});
		return this.formatFriendForSending(friend);
	}

	async fetchFriendsByUserID(id: number): Promise<sendFriendDto[]> {
		const friends = await this.friendRepository.find({
			where: [{user1: {id: id}}, {user2: {id: id}}],
			relations: ['user1', 'user2'],
		});
		return this.formatFriendArrayForSending(friends);
	}

	async fetchFriendEntityByUserIDs(
		userID1: number,
		userID2: number,
	): Promise<FriendEntity> {
		const user1 = await this.userService.fetchUserByID(userID1);
		const user2 = await this.userService.fetchUserByID(userID2);
		if (!user1 || !user2) throw new BadRequestException('User not found');
		const foundRecord = await this.friendRepository.findOne({
			where: [
				{
					user1: {id: user1.id},
					user2: {id: user2.id},
				},
				{
					user1: {id: user2.id},
					user2: {id: user1.id},
				},
			],
			relations: ['user1', 'user2'],
		});
		return foundRecord;
	}

	async fetchFriendByUserIDs(
		userID1: number,
		userID2: number,
	): Promise<sendFriendDto> {
		const friendEntity = await this.fetchFriendEntityByUserIDs(
			userID1,
			userID2,
		);
		if (!friendEntity) {
			throw new BadRequestException('Could not find friend relation');
		}
		return this.formatFriendForSending(friendEntity);
	}

	async createFriend(friendDetails: createFriendParams): Promise<FriendEntity> {
		if (friendDetails.userID1 === friendDetails.userID2)
			throw new BadRequestException('Cannot friend yourself !');
		const user1 = await this.userService.fetchUserByID(friendDetails.userID1);
		const user2 = await this.userService.fetchUserByID(friendDetails.userID2);
		if (!user1 || !user2) throw new BadRequestException('User not found');
		const areBlocked =
			await this.blockedUserService.usersAreBlockingEachOtherByUserIDs(
				user1.id,
				user2.id,
			);
		if (areBlocked) {
			throw new BadRequestException('Cannot friend a blocked user');
		}

		const foundRecord = await this.friendRepository.find({
			where: [
				{
					user1: {id: user1.id},
					user2: {id: user2.id},
				},
				{
					user1: {id: user2.id},
					user2: {id: user1.id},
				},
			],
		});
		if (foundRecord.length > 0) {
			return foundRecord[0];
		}
		const newFriend = this.friendRepository.create({
			user1: user1,
			user2: user2,
		});
		return this.friendRepository.save(newFriend);
	}

	async deleteFriendByID(id: number): Promise<DeleteResult> {
		return this.friendRepository.delete({id});
	}

	async deleteFriendByUserIDs(
		friendDetails: updateFriendParams,
	): Promise<DeleteResult> {
		const friendRelationship = await this.fetchFriendEntityByUserIDs(
			friendDetails.userID1,
			friendDetails.userID2,
		);
		if (friendRelationship) return this.deleteFriendByID(friendRelationship.id);
	}
}
