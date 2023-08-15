import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PasswordService } from 'src/password/password.service';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private passwordService: PasswordService,
    private jwtService: JwtService,
    ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.fetchUserByUsername(username);
    if (!user) {
        console.log("[Auth Service]: user not found.");
        return null;
    }
    if (!(await this.passwordService.checkPassword(password, user.password))){
        console.log("[Auth Service]: passwords don't match!");
        return null;
    }
    return user;
  }

  async login(user: UserEntity) {
    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
