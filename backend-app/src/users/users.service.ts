import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/typeorm/entities/user.entity';
import { createUserParams } from 'src/users/utils/types';
import { updateUserParams } from 'src/users/utils/types';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {

    constructor(@InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,) {}

    fetchUsers() {
        return this.userRepository.find();
    }

    createUser(userDetails: createUserParams) {
        const newUser = this.userRepository.create({ ...userDetails, createdAt: new Date() });
        return this.userRepository.save(newUser);
    }

    fetchUserByID(id: number) {
        return this.userRepository.findOne({ where: {id} });
    }

    updateUserByID(id: number, userDetails: updateUserParams) {
        return this.userRepository.update({ id }, { ...userDetails });
    }

    deleteUserByID(id: number) {
        return this.userRepository.delete({ id });
    }
}
