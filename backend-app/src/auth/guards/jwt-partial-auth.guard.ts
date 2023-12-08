import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

// Implements JwtPartialStrategy:
// Checks if the JWT token in the request header is valid and corresponds to a database user
// Does not check if user is fully authenticated (that's JwtFullAuthGuard's job).

@Injectable()
export class JwtPartialAuthGuard extends AuthGuard("jwt-partial-auth") {}
