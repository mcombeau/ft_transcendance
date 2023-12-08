import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

// Implements JwtFullStrategy:
// Checks if the JWT token in the request header is valid and corresponds to a database user
// And also checks if user is fully authenticated with 2FA.

@Injectable()
export class JwtFullAuthGuard extends AuthGuard("jwt-full-auth") {}
