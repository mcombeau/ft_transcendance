import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { UsersService } from "../../users/users.service";

// TODO [iazimzha]: WTF is secretOrKey: 'secret' ????? Do we need to change this ???
// TODO [mcombeau]: Also put that secret in env file??
@Injectable()
export class Jwt2faStrategy extends PassportStrategy(Strategy, "jwt-2fa") {
	constructor(private readonly userService: UsersService) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: "secret",
		});
	}

	async validate(payload: any) {
		console.log("[JWT-2FA Auth Guard] payload:", payload);
		const user = await this.userService.fetchUserByUsername(payload.username);

		if (!user.isTwoFactorAuthenticationEnabled) {
			return user;
		}
		if (payload.isTwoFactorAuthenticated) {
			return user;
		}
	}
}
