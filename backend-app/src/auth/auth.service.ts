import { Injectable, Logger } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { userStatus } from "../users/entities/user.entity";
import { PasswordService } from "src/password/password.service";
import { JwtService } from "@nestjs/jwt";
import { UserEntity } from "src/users/entities/user.entity";
import { jwtConstants } from "./constants";
import { toDataURL } from "qrcode";
import { authenticator } from "otplib";
import { UserNotFoundError } from "src/exceptions/not-found.interceptor";
import * as jwt from "jsonwebtoken";
import { InvalidTokenError } from "src/exceptions/bad-request.interceptor";

export type JwtToken = {
	username: string;
	userID: number;
	isTwoFactorAuthenticationEnabled: boolean;
	isTwoFactorAuthenticated: boolean;
	iat: number;
	exp: number;
};

// TODO: Do not store JWT token in cookie or local storage??? Store as cookie with 'HTTP only' !
// prevent CSRF XSS.
@Injectable()
export class AuthService {
	constructor(
		private userService: UsersService,
		private passwordService: PasswordService,
		private jwtService: JwtService
	) {}

	private readonly logger: Logger = new Logger("Auth Service");

	async login(user: UserEntity): Promise<any> {
		this.logger.log(`[Login]: user ${user.username} logging in`);

		const payload = {
			username: user.username,
			userID: user.id,
			isTwoFactorAuthenticationEnabled: user.isTwoFactorAuthenticationEnabled,
			isTwoFactorAuthenticated: false,
		};
		await this.userService.updateUserByID(user.id, {
			status: userStatus.ONLINE,
		});
		return {
			access_token: this.jwtService.sign(payload),
		};
	}

	async logout(userID: number): Promise<void> {
		const dbUser = await this.userService.fetchUserByID(userID);
		if (!dbUser) {
			this.logger.error(`[Logout]: user ${userID} not in database!`);
			throw new UserNotFoundError();
		}
		this.logger.log(`[Logout]: user ${dbUser.username} logging out`);
		await this.userService.updateUserByID(dbUser.id, {
			status: userStatus.OFFLINE,
		});
	}

	private async doesTokenInformationMatchDatabase(
		tokenInfo: JwtToken
	): Promise<boolean> {
		const user = await this.userService.fetchUserByID(tokenInfo.userID);
		if (
			!user ||
			user.id !== tokenInfo.userID ||
			user.username !== tokenInfo.username
		) {
			return false;
		}
		return true;
	}

	// Dont know if this should be elsewhere
	async validateToken(token: string): Promise<JwtToken> {
		try {
			if (!token || token === undefined || token === "undefined") {
				this.logger.warn(
					`[Validate Token]: no token to validate: user is not logged in.`
				);
				return null;
			}
			const tokenInfo: JwtToken = jwt.verify(
				token,
				jwtConstants.secret
			) as JwtToken;

			if ((await this.doesTokenInformationMatchDatabase(tokenInfo)) === false) {
				throw new UserNotFoundError(
					`User ${tokenInfo.username} of ID ${tokenInfo.userID} does not exist in database!`
				);
			}
			return tokenInfo;
		} catch (e) {
			// TODO: emit signal to front that the token is invalid / no user in db

			this.logger.error(`[Validate Token] error: ${e.message}`);
			throw new InvalidTokenError(e.message);
		}
	}

	async validateUser(
		username: string,
		password: string
	): Promise<null | UserEntity> {
		this.logger.log(
			`[Validate User]: validating user with username and password`
		);
		const user = await this.userService.fetchUserByUsername(username);
		if (!user) {
			this.logger.warn("[Validate User]: user not found");
			return null;
		}
		if (!(await this.passwordService.checkPassword(password, user))) {
			this.logger.warn("[Validate User]: passwords don't match!");
			return null;
		}
		return user;
	}

	async school42Login(req: any, res: any): Promise<void> {
		const user: UserEntity = req.user;
		this.logger.log(
			`[School 42 Login]: user ${user.username} logging in via 42 API`
		);
		const access_token = await this.login(user);
		res.cookie("token", access_token.access_token);
		res.redirect(302, `/user/${user.id}#settings`);
	}

	async generateTwoFactorAuthenticationSecret(userInfo: {
		userID: number;
		username: string;
	}) {
		const secret = authenticator.generateSecret();

		const user = await this.userService.fetchUserByUsername(userInfo.username);
		const otpAuthUrl = authenticator.keyuri(
			user.email,
			"ft_transcendance",
			secret
		);

		await this.userService.setTwoFactorAuthenticationSecret(secret, user.id);

		return {
			secret,
			otpAuthUrl,
		};
	}

	async generateQrCodeDataURL(otpAuthUrl: string) {
		return toDataURL(otpAuthUrl);
	}

	async isTwoFactorAuthenticationCodeValid(
		twoFactorAuthenticationCode: string,
		userInfo: { userID: number; username: string }
	) {
		const twoFactorAuthenticationSecret: string =
			await this.userService.getUser2faSecret(userInfo.userID);
		return authenticator.verify({
			token: twoFactorAuthenticationCode,
			secret: twoFactorAuthenticationSecret,
		});
	}

	async loginWith2fa(userWithoutPsw: Partial<UserEntity>) {
		const user = await this.userService.fetchUserByUsername(
			userWithoutPsw.username
		);
		const payload = {
			userID: user.id,
			username: user.username,
			email: user.email,
			isTwoFactorAuthenticationEnabled: user.isTwoFactorAuthenticationEnabled,
			isTwoFactorAuthenticated: true,
		};

		return {
			email: payload.email,
			access_token: this.jwtService.sign(payload),
		};
	}
}
