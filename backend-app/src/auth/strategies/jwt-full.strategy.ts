import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, Logger } from "@nestjs/common";
import { jwtConstants } from "../constants";
import { UsersService } from "src/users/users.service";
import { AuthService } from "../auth.service";
import { UserEntity } from "src/users/entities/user.entity";

// Checks if the JWT token in the request header is valid and corresponds to a database user
// And also checks if user is fully authenticated with 2FA.

@Injectable()
export class JwtFullStrategy extends PassportStrategy(
	Strategy,
	"jwt-full-auth"
) {
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

	private readonly logger: Logger = new Logger("JwtFullStrategy");

	async validate(tokenInfo: any): Promise<UserEntity> {
		this.logger.debug("[Validate]: validating token");
		try {
			await this.authService.validateTokenAuthentication(tokenInfo);
			return await this.userService.fetchUserByID(tokenInfo.userID);
		} catch (e) {
			console.log(e.message);
			return null;
		}
	}
}
