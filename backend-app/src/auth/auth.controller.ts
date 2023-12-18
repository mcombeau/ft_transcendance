import { Inject, forwardRef } from "@nestjs/common";
import {
	Controller,
	Body,
	Get,
	HttpCode,
	Headers,
	Post,
	Request,
	Response,
	Res,
	UseGuards,
	UnauthorizedException,
} from "@nestjs/common";
import { AuthService, JwtToken } from "./auth.service";
import { JwtFullAuthGuard } from "./guards/jwt-full-auth.guard";
import { JwtPartialAuthGuard } from "./guards/jwt-partial-auth.guard";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { school42AuthGuard } from "./guards/school42-auth.guard";
import { ApiTags } from "@nestjs/swagger";
import { UsersService } from "../users/users.service";
import { BadRequestException } from "@nestjs/common";

@ApiTags("auth")
@Controller()
export class AuthController {
	constructor(
		private authService: AuthService,
		@Inject(forwardRef(() => UsersService))
		private userService: UsersService
	) {}

	@UseGuards(LocalAuthGuard)
	@Post("auth/login")
	async login(@Request() req: any): Promise<any> {
		return this.authService.login(req.user);
	}

	@UseGuards(JwtFullAuthGuard)
	@Post("auth/logout")
	async logout(@Request() req: any): Promise<any> {
		if (req.user === undefined) {
			throw new BadRequestException("No user to log out");
		}
		return this.authService.logout(req.user.userID);
	}

	@Get("auth/42login")
	@UseGuards(school42AuthGuard)
	async school42Auth(): Promise<void> {
		return;
	}

	@Get("auth/callback")
	@UseGuards(school42AuthGuard)
	school42AuthRedirect(
		@Request() req: Request,
		@Res({ passthrough: true }) res: Response
	): Promise<void> {
		return this.authService.school42Login(req, res);
	}

	@Post("auth/2fa/generate")
	@UseGuards(JwtFullAuthGuard)
	async register(@Response() response: any, @Headers() headers: Headers) {
		const tokenInfo: JwtToken =
			await this.authService.getValidTokenInfoFromHeaders(headers);
		const { otpAuthUrl } =
			await this.authService.generateTwoFactorAuthenticationSecret(
				tokenInfo.userID
			);
		return response.json(
			await this.authService.generateQrCodeDataURL(otpAuthUrl)
		);
	}

	@Post("auth/2fa/turn-on")
	@UseGuards(JwtFullAuthGuard)
	async turnOnTwoFactorAuthentication(
		@Body() body: any,
		@Headers() headers: Headers
	) {
		const tokenInfo: JwtToken =
			await this.authService.getValidTokenInfoFromHeaders(headers);
		const isCodeValid =
			await this.authService.isTwoFactorAuthenticationCodeValid(
				body.twoFactorAuthenticationCode,
				tokenInfo.userID
			);
		if (!isCodeValid) {
			throw new UnauthorizedException("Wrong authentication code");
		}
		await this.userService.setTwoFactorAuthentication(tokenInfo.userID, true);
	}

	@Post("auth/2fa/turn-off")
	@UseGuards(JwtFullAuthGuard)
	async turnOffTwoFactorAuthentication(@Headers() headers: Headers) {
		const tokenInfo: JwtToken =
			await this.authService.getValidTokenInfoFromHeaders(headers);
		await this.userService.setTwoFactorAuthentication(tokenInfo.userID, false);
	}

	@Post("auth/2fa/authenticate")
	@HttpCode(200)
	@UseGuards(JwtPartialAuthGuard)
	async authenticate(@Body() body: any, @Headers() headers: Headers) {
		const tokenInfo: JwtToken =
			await this.authService.getValidTokenInfoFromHeaders(headers);
		const isCodeValid =
			await this.authService.isTwoFactorAuthenticationCodeValid(
				body.twoFactorAuthenticationCode,
				tokenInfo.userID
			);

		if (!isCodeValid) {
			throw new UnauthorizedException("Wrong authentication code");
		}

		return this.authService.loginWith2fa(tokenInfo);
	}
}
