import { Module, forwardRef } from "@nestjs/common";
import { UsersModule } from "src/users/users.module";
import { AuthController } from "./auth.controller";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { LocalStrategy } from "./strategies/local.strategy";
import { PasswordModule } from "src/password/password.module";
import { jwtConstants } from "./constants";
import { ConfigModule } from "@nestjs/config";
import { school42Strategy } from "./strategies/school42.strategy";
import { JwtFullStrategy } from "./strategies/jwt-full.strategy";
import { JwtPartialStrategy } from "./strategies/jwt-partial.strategy";
import { JwtSelfStrategy } from "./strategies/jwt-self.strategy";

@Module({
	imports: [
		ConfigModule.forRoot(),
		forwardRef(() => UsersModule),
		forwardRef(() => PasswordModule),
		PassportModule.register({ defaultStrategy: "jwt-full-auth" }),
		JwtModule.register({
			secret: jwtConstants.secret, // Replace with your own secret key for signing the token
			signOptions: { expiresIn: "24h" }, // Token expires in 1 hour
		}),
	],
	controllers: [AuthController],
	providers: [
		AuthService,
		LocalStrategy,
		JwtFullStrategy,
		JwtPartialStrategy,
		JwtSelfStrategy,
		school42Strategy,
	],
	exports: [AuthService],
})
export class AuthModule {}
