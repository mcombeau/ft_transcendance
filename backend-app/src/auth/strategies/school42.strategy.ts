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

// TODO: move callback URL away from localhost to process.env.FT_TRANSCENDANCE_DOMAIN url
const CALLBACKURL = "http://localhost/backend/auth/callback";
@Injectable()
export class school42Strategy extends PassportStrategy(Strategy, "42") {
	constructor(
		@Inject(forwardRef(() => UsersService)) private userService: UsersService
	) {
		super({
			callbackURL: CALLBACKURL,
			authorizationURL: `https://api.intra.42.fr/oauth/authorize?client_id=${process.env.AUTH42_CLIENT_ID}&redirect_uri=${CALLBACKURL}&response_type=code&grant_type=authorization_code`,
			tokenURL: "https://api.intra.42.fr/oauth/token",
			clientID: process.env.AUTH42_CLIENT_ID,
			clientSecret: process.env.AUTH42_CLIENT_SECRET,
			scope: ["public", "profile"],
		});
	}

	private async generate_username(login42: string) {
		let username: string = login42;
		let userWithUsername = await this.userService.fetchUserByUsername(username);
		if (userWithUsername.login42 === login42) {
			return username;
		} else {
			let i = 0;
			while (userWithUsername) {
				username = login42 + "_" + i.toString();
				i++;
				userWithUsername = await this.userService.fetchUserByUsername(username);
			}
		}
		return username;
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
			username: await this.generate_username(userResponse.data.login),
			login42: userResponse.data.login,
			email: userResponse.data.email,
			password: null,
			// profilePicture = userInfo.image?.link
		};

		const userWith42Login = await this.userService.fetchUserBy42Login(
			userInfo.login42
		);

		let user: UserEntity;
		if (!userWith42Login) {
			user = await this.userService.createUser({
				...userInfo,
			});
		} else {
			user = userWith42Login;
		}
		done(null, user);
	}
}
