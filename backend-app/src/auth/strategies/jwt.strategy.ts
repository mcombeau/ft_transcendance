import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { jwtConstants } from "../constants";
import { UsersService } from "src/users/users.service";
import { AuthService } from "../auth.service";
import { UserEntity } from "src/users/entities/user.entity";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		private authService: AuthService,
		private userService: UsersService
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: jwtConstants.secret,
		});
	}

	async validate(tokenInfo: any): Promise<UserEntity> {
		console.log("[JwtStrategy][Validate]");
		try {
			await this.authService.validateTokenAuthentication(tokenInfo);
			return await this.userService.fetchUserByID(tokenInfo.userID);
		} catch (e) {
			console.log(e.message);
			return null;
		}
	}
}
