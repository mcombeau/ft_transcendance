import { Inject, forwardRef, Logger } from "@nestjs/common";
import {
	Controller,
	Body,
	Get,
	HttpCode,
	Post,
	Request,
	Req,
	Response,
	Res,
	UseGuards,
	UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
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

	private readonly logger: Logger = new Logger("Auth Controller");

	@UseGuards(LocalAuthGuard)
	@Post("auth/login")
	async login(@Request() req: any): Promise<any> {
		return this.authService.login(req.user);
	}

	@UseGuards(JwtAuthGuard)
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
		console.log("[Auth Controller]: GET on auth/42login");
	}

	@Get("auth/callback")
	@UseGuards(school42AuthGuard)
	school42AuthRedirect(
		@Request() req: Request,
		@Res({ passthrough: true }) res: Response
	): Promise<void> {
		console.log("[Auth Controller]: GET on auth/callback");
		return this.authService.school42Login(req, res);
	}

	@Post("auth/2fa/generate")
	@UseGuards(JwtAuthGuard)
	async register(@Response() response, @Request() request) {
		const { otpAuthUrl } =
			await this.authService.generateTwoFactorAuthenticationSecret(
				request.user
			);

		return response.json(
			await this.authService.generateQrCodeDataURL(otpAuthUrl)
		);
	}

	@Post("auth/2fa/turn-on")
	@UseGuards(JwtAuthGuard)
	async turnOnTwoFactorAuthentication(@Req() request, @Body() body) {
		const isCodeValid =
			await this.authService.isTwoFactorAuthenticationCodeValid(
				body.twoFactorAuthenticationCode,
				request.user
			);
		if (!isCodeValid) {
			throw new UnauthorizedException("Wrong authentication code");
		}
		await this.userService.setTwoFactorAuthentication(
			request.user.userID,
			true
		);
	}

	@Post("auth/2fa/turn-off")
	@UseGuards(JwtAuthGuard)
	async turnOffTwoFactorAuthentication(@Req() request) {
		await this.userService.setTwoFactorAuthentication(
			request.user.userID,
			false
		);
	}

	@Post("auth/2fa/authenticate")
	@HttpCode(200)
	@UseGuards(JwtAuthGuard)
	async authenticate(@Request() request, @Body() body) {
		const isCodeValid =
			await this.authService.isTwoFactorAuthenticationCodeValid(
				body.twoFactorAuthenticationCode,
				request.user
			);

		if (!isCodeValid) {
			throw new UnauthorizedException("Wrong authentication code");
		}

		return this.authService.loginWith2fa(request.user);
	}
}
