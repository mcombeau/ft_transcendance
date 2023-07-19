import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/typeorm/entities/user.entity';
import { createUserParams } from 'src/users/utils/types';
import { updateUserParams } from 'src/users/utils/types';
import { Repository } from 'typeorm';
import { HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  fetchUsers() {
    return this.userRepository.find();
  }

  async createUser(userDetails: createUserParams) {
    const newUser = this.userRepository.create({
      ...userDetails,
      createdAt: new Date(),
    });
    return this.userRepository.save(newUser).catch((err: any) => {
      console.log(err);
      throw new HttpException(
        'Error during user creation',
        HttpStatus.BAD_REQUEST,
      );
    });
  }

  fetchUserByID(id: number) {
    return this.userRepository.findOne({ where: { id } });
  }

  fetchUserByUsername(username: string) {
    return this.userRepository.findOne({ where: { username: username } });
  }

  updateUserByID(id: number, userDetails: updateUserParams) {
    return this.userRepository.update({ id }, { ...userDetails });
  }

  deleteUserByID(id: number) {
    return this.userRepository.delete({ id });
  }
}
