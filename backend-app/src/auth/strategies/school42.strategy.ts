import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-oauth2";
import {
	BadRequestException,
	Inject,
	Injectable,
	forwardRef,
} from "@nestjs/common";
import { UsersService } from "src/users/users.service";
import axios from "axios";
import { UserEntity } from "src/users/entities/user.entity";

@Injectable()
export class school42Strategy extends PassportStrategy(Strategy, "42") {
	constructor(
		@Inject(forwardRef(() => UsersService)) private userService: UsersService
	) {
		super({
			callbackURL: "http://localhost:3001/auth/callback",
			authorizationURL: `https://api.intra.42.fr/oauth/authorize?client_id=${process.env.AUTH42_CLIENT_ID}&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fauth%2Fcallback&response_type=code&grant_type=authorization_code`,
			tokenURL: "https://api.intra.42.fr/oauth/token",
			clientID: process.env.AUTH42_CLIENT_ID,
			clientSecret: process.env.AUTH42_CLIENT_SECRET,
			scope: ["public", "profile"],
		});
	}
	async validate(
		accessToken: string,
		refreshToken: string,
		profile: any,
		done: VerifyCallback
	): Promise<any> {
		const userResponse = await axios.get("https://api.intra.42.fr/v2/me", {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});
		if (!profile) {
			return done(new BadRequestException(), null);
		}

		const userInfo = {
			username: userResponse.data.login,
			login42: userResponse.data.login,
			email: userResponse.data.email,
			password: null,
			// profilePicture = userInfo.image?.link
		};

		const userWithLogin = await this.userService.fetchUserBy42Login(
			userInfo.username
		);
		const userWithUsername = await this.userService.fetchUserByUsername(
			userInfo.username
		);
		let user: UserEntity;
		if (!userWithLogin && !userWithUsername) {
			user = await this.userService.createUser({
				...userInfo,
			});
		} else if (userWithUsername) {
			user = userWithUsername;
		} else if (!userWithUsername && userWithLogin) {
			user = userWithLogin;
		}
		done(null, user);
	}
}
