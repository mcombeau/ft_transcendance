import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, Logger } from "@nestjs/common";
import { UsersService } from "../../users/users.service";
import { AuthService, JwtToken } from "../auth.service";
import { jwtConstants } from "../constants";
import { UserEntity } from "src/users/entities/user.entity";

// Checks if the JWT token in the request header is valid and corresponds to a database user

@Injectable()
export class JwtPartialStrategy extends PassportStrategy(
	Strategy,
	"jwt-partial-auth"
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

	private readonly logger: Logger = new Logger("JwtPartialStrategy");

	// TODO: use this but don't check if the token is fully authenticated:
	async validate(tokenInfo: JwtToken): Promise<UserEntity> {
		this.logger.debug("[Validate]: validating token");
		try {
			// await this.authService.validateTokenAuthentication(tokenInfo);
			return await this.userService.fetchUserByID(tokenInfo.userID);
		} catch (e) {
			console.log(e.message);
			return null;
		}
	}
}
