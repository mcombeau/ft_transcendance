import { Injectable, Request, Response, Res } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { userStatus } from "../users/entities/user.entity";
import { PasswordService } from "src/password/password.service";
import { JwtService } from "@nestjs/jwt";
import { UserEntity } from "src/users/entities/user.entity";
import { jwtConstants } from "./constants";
import { toDataURL } from "qrcode";
import { authenticator } from "otplib";
import { UserNotFoundError } from "src/exceptions/not-found.interceptor";

// TODO: Do not store JWT token in cookie or local storage??? Store as cookie with 'HTTP only' !
// prevent CSRF XSS.
@Injectable()
export class AuthService {
	constructor(
		private userService: UsersService,
		private passwordService: PasswordService,
		private jwtService: JwtService
	) {}

	async validateUser(
		username: string,
		password: string
	): Promise<null | UserEntity> {
		console.log("[Auth Service]: validate local user");
		console.log("[Auth Service]: username", username, "password", password);
		const user = await this.userService.fetchUserByUsername(username);
		console.log("[Auth Service]: User", user);
		if (!user) {
			console.log("[Auth Service]: user not found.");
			return null;
		}
		if (!(await this.passwordService.checkPassword(password, user))) {
			console.log("[Auth Service]: passwords don't match!");
			return null;
		}
		return user;
	}

	async login(user: UserEntity): Promise<any> {
		console.log("[Auth Service]: login user");
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

	async logout(user: UserEntity): Promise<void> {
		console.log("[Auth Service]: logout user", user);
		const dbUser = await this.userService.fetchUserByUsername(user.username);
		if (!dbUser) {
			throw new UserNotFoundError();
		}
		await this.userService.updateUserByID(dbUser.id, {
			status: userStatus.OFFLINE,
		});
	}

	// Dont know if this should be elsewhere
	async validateToken(token: string): Promise<any> {
		const jwt = require("jsonwebtoken");
		return await jwt.verify(token, jwtConstants.secret);
	}

	async school42Login(req: any, res: any): Promise<void> {
		console.log("[Auth Service]: school42login");
		const user: UserEntity = req.user;
		const access_token = await this.login(user);
		res.cookie("token", access_token.access_token);
		res.redirect(302, "/user/${user.id}");
	}

	async generateTwoFactorAuthenticationSecret(userInfo: any) {
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
		userInfo: any
	) {
		const user = await this.userService.fetchUserByUsername(userInfo.username);
		return authenticator.verify({
			token: twoFactorAuthenticationCode,
			secret: user.twoFactorAuthenticationSecret,
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
