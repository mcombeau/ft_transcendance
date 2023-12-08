import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { jwtConstants } from "../constants";
import { UsersService } from "src/users/users.service";
import { AuthService, JwtToken } from "../auth.service";
import { UserEntity } from "src/users/entities/user.entity";

// Checks if the JWT token user ID in the request header corresponds the route's ID param
// so that a user cannot modify another user's profile, for example

@Injectable()
export class JwtSelfStrategy extends PassportStrategy(
	Strategy,
	"jwt-self-auth"
) {
	constructor(
		private authService: AuthService,
		private userService: UsersService
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: jwtConstants.secret,
			passReqToCallback: true,
		});
	}

	private readonly logger: Logger = new Logger("JwtSelfStrategy");

	async validate(req: Request, tokenInfo: JwtToken): Promise<UserEntity> {
		this.logger.debug("[Validate]: validating token");
		try {
			const paramID: number = parseInt((req as any).params.id);
			this.authService.checkTokenMatchesUserID(tokenInfo, paramID);
			return await this.userService.fetchUserByID(tokenInfo.userID);
		} catch (e) {
			this.logger.error(e.message);
			throw new UnauthorizedException();
		}
	}
}
