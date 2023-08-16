import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PasswordService } from 'src/password/password.service';
import { UserEntity } from 'src/users/entities/user.entity';
import { createUserParams } from 'src/users/utils/types';
import { updateUserParams } from 'src/users/utils/types';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
      private userRepository: Repository<UserEntity>,
    @Inject(forwardRef( () => PasswordService))
      private passwordService: PasswordService,
  ) {}

  fetchUsers() {
    return this.userRepository.find();
  }

  async createUser(userDetails: createUserParams) {
    const hashedPassword = await this.passwordService.hashPassword(userDetails.password);
    userDetails.password = hashedPassword;
    const newUser = this.userRepository.create({
      ...userDetails,
      createdAt: new Date(),
    });
    return this.userRepository.save(newUser);
  }

  fetchUserByID(id: number) {
    return this.userRepository.findOne({
      where: { id },
      relations: ['chatRooms.chatRoom'],
    });
  }

  fetchUserByUsername(username: string) {
    return this.userRepository.findOne({
      where: { username: username },
      relations: ['chatRooms.chatRoom'],
    });
  }

  updateUserByID(id: number, userDetails: updateUserParams) {
    return this.userRepository.update({ id }, { ...userDetails });
  }

  deleteUserByID(id: number) {
    return this.userRepository.delete({ id });
  }
}
