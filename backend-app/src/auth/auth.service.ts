import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
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

	async checkTokenMatchesDatabaseUser(tokenInfo: JwtToken): Promise<void> {
		const user = await this.userService.fetchUserByID(tokenInfo.userID);
		if (!user || user.id !== tokenInfo.userID) {
			throw new UnauthorizedException(
				`User ${tokenInfo.username} (id ${tokenInfo.userID}) does not exist in database!`
			);
		}
	}

	checkTokenMatchesUserID(tokenInfo: JwtToken, userID: number): void {
		if (tokenInfo.userID !== userID) {
			throw new UnauthorizedException(
				`User ${tokenInfo.username} (id ${tokenInfo.userID}) is not user id ${userID}!`
			);
		}
	}

	checkUserIsFullyAuthenticated(tokenInfo: JwtToken): void {
		if (
			tokenInfo.isTwoFactorAuthenticationEnabled &&
			!tokenInfo.isTwoFactorAuthenticated
		) {
			throw new UnauthorizedException(
				`User ${tokenInfo.username} (id ${tokenInfo.userID}) is not fully logged in!`
			);
		}
	}

	async getValidTokenInfoFromHeaders(headers: Headers): Promise<JwtToken> {
		const token = headers["authorization"].split(" ")[1];
		return await this.validateToken(token);
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
			await this.checkTokenMatchesDatabaseUser(tokenInfo);
			return tokenInfo;
		} catch (e) {
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
		res.redirect(302, `/finalize-login`);
	}

	async generateTwoFactorAuthenticationSecret(userID: number) {
		const secret = authenticator.generateSecret();

		const user = await this.userService.fetchUserByID(userID);
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
		return toDataURL(otpAuthUrl, {
			color: {
				dark: "#265073", // Blue dots
				light: "#0000", // Transparent background
			},
		});
	}

	async isTwoFactorAuthenticationCodeValid(
		twoFactorAuthenticationCode: string,
		userID: number
	) {
		const twoFactorAuthenticationSecret: string =
			await this.userService.getUser2faSecret(userID);
		return authenticator.verify({
			token: twoFactorAuthenticationCode,
			secret: twoFactorAuthenticationSecret,
		});
	}

	async loginWith2fa(tokenInfo: JwtToken) {
		const user = await this.userService.fetchUserByID(tokenInfo.userID);
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
